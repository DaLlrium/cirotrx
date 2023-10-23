 pragma solidity >=0.8.0;
// SPDX-License-Identifier: Apache-2.0

contract Ownable {
  address public owner;

  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  constructor() {
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}

library SafeMath {

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;

        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {

        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {

        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;

        return c;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "SafeMath: modulo by zero");
        return a % b;
    }
}

interface TRC20_Interface {

  function allowance(address _owner, address _spender) external view returns (uint remaining);
  function transferFrom(address _from, address _to, uint _value) external returns (bool);
  function transfer(address direccion, uint cantidad) external returns (bool);
  function balanceOf(address who) external view returns (uint256);
  function decimals() external view returns (uint256);
  function totalSupply() external view returns (uint256);
  function issue(uint amount) external;
  function redeem(uint amount) external;
  function transferOwnership(address newOwner) external;

}

contract CiroFee is Ownable{
  using SafeMath for uint256;

  address [] public tokens = [0xa614f803B6FD780986A42c78Ec9c7f77e6DeD13C, 0x94F24E992cA04B49C6f2a2753076Ef8938eD4daa,0x3487b63D30B5B2C87fb7fFa8bcfADE38EAaC1abe,0xcEbDE71077b830B958C8da17bcddeeB85D0BCf25,0x148cf421E250b13E3Ae00D65977bbA14d70DD9f7,0x83c91BfDE3e6D130E286A3722F171ae49fb25047,0x834295921A488D9d42b4b3021ED1a3C39fB0f03e];
  uint256 [] public FEE = [75*10**4, 50*10**4, 75*10**4, 75*10**4, 75*10**5, 75*10**4, 50*10**4];
  bool [] public fijo = [true, true, true, true, true, true, true];
  uint256 [] public presiso = [100, 100, 100, 100, 100, 100, 100];

  constructor() {}

  function changeTokens(address [] memory _tokens, uint256 [] memory _FEE, bool [] memory _fijo, uint256 [] memory _presiso ) public onlyOwner {
    tokens = _tokens;
    FEE = _FEE;
    fijo = _fijo;
    presiso = _presiso;

  }

  function updateToken(uint256 _id, address _tokens, uint256 _FEE, bool _fijo, uint256 _presiso ) public onlyOwner {
    tokens[_id] = _tokens;
    FEE[_id] = _FEE;
    fijo[_id] = _fijo;
    presiso[_id] = _presiso;

  }

  function addToken(address _tokens, uint256 _FEE, bool _fijo, uint256 _presiso) public onlyOwner{
    tokens.push(_tokens);
    FEE.push(_FEE);
    fijo.push(_fijo);
    presiso.push(_presiso);
    
  }

  function deleteToken(uint256 _id) public onlyOwner{
    tokens[_id] = tokens[tokens.length - 1];
    tokens.pop();
    FEE[_id] = FEE[FEE.length - 1];
    FEE.pop();
    fijo[_id] = fijo[fijo.length - 1];
    fijo.pop();
    presiso[_id] = presiso[presiso.length - 1];
    presiso.pop();
    
  }

  function tokenList()public view returns(address [] memory, uint256 [] memory, bool [] memory,uint256 [] memory) {
    return (tokens,FEE,fijo,presiso);
  }

  function transfer(address _to, uint256 _value, uint256 _token) public returns(bool){

    TRC20_Interface Token_Contract = TRC20_Interface(tokens[_token]);

    if(fijo[_token]){
      if( _value <= FEE[_token] )revert();
      Token_Contract.transferFrom(msg.sender, address(this), _value);
      Token_Contract.transfer(_to, _value.sub(FEE[_token]));

    }else{
        
      Token_Contract.transferFrom(msg.sender, address(this), _value);
      Token_Contract.transfer(_to, _value.mul(FEE[_token]).div(presiso[_token]));
    }
    
    return true;

  }

  function multiTransfer(address [] memory _to, uint256 [] memory _value, uint256 _token) public returns(bool){

    uint256 total = 0;

    TRC20_Interface Token_Contract = TRC20_Interface(tokens[_token]);

    for (uint256 index = 0; index < _value.length; index++) {
      total = total.add(_value[index]);
    }

    Token_Contract.transferFrom(msg.sender, address(this), total);

    if(fijo[_token]){

      for (uint256 index = 0; index < _value.length; index++) {
        if( _value[index] <= FEE[_token] )revert();
        Token_Contract.transfer(_to[index], _value[index].sub(FEE[_token])) ;
          
      }
    }else{

      for (uint256 index = 0; index < _value.length; index++) {
        if( _value[index] <= FEE[_token] )revert();
        Token_Contract.transfer(_to[index], _value[index].mul(FEE[_token]).div(presiso[_token]));
          
      }

    }

    return true;

  }

  function redimirToken(uint256 _token) public onlyOwner returns (uint256){
    TRC20_Interface Token_Contract = TRC20_Interface(tokens[_token]);
    uint256 valor = Token_Contract.balanceOf(address(this));
    Token_Contract.transfer(owner, valor);
    return valor;
  }

  function redimirUSDT02(uint _value, uint256 _token) public onlyOwner {
    TRC20_Interface Token_Contract = TRC20_Interface(tokens[_token]);
    if ( Token_Contract.balanceOf(address(this)) < _value)revert();
    Token_Contract.transfer(owner, _value);

  }

  function redimTRX() public onlyOwner {
    if ( address(this).balance == 0)revert();
    payable(owner).transfer( address(this).balance );

  }

  function redimTRX(uint _value) public onlyOwner {
    if ( address(this).balance < _value)revert();
    payable(owner).transfer( _value);

  }

  fallback() external payable {}
  receive() external payable {}

}