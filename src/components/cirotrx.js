import React, { Component } from "react";
import cons from "../cons.js";

import TronLinkGuide from "./tronlink.js";

export default class CiroTrx extends Component {
  constructor(props) {
    super(props);

    this.state = {

      minCompra: 0.75,
      minventa: 1,
      deposito: "Loading...",
      valueBRUT: "",
      valueUSDT: "",
      value: "",
      cantidad: 0,
      tiempo: 0,
      enBrutus: 0,
      tokensEmitidos: 0,
      enPool: 0,
      solicitado: 0,
      data: [],
      precioBRST: "#.###",
      solicitudes: 0,
      temporalidad: "day",
      cantidadDatos: 30,
      dias: "Loading...",
      tronWeb: {
        loggedIn: false,
        installed: false
      },
      contrato: {
        USDT: null,
        ciro_trx: null
      },
      wallet: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
      tokenSend: "0",
      elementSelect: <option>Loading...</option>


    };

    this.conectar = this.conectar.bind(this);

    this.compra = this.compra.bind(this);
    this.estado = this.estado.bind(this);

    this.handleChange = this.handleChange.bind(this);
    this.handleChange2 = this.handleChange2.bind(this);

    this.handleChangeBRUT = this.handleChangeBRUT.bind(this);
    this.handleChangeUSDT = this.handleChangeUSDT.bind(this);

    this.llenarBRST = this.llenarBRST.bind(this);
    this.llenarUSDT = this.llenarUSDT.bind(this);

    this.consultarPrecio = this.consultarPrecio.bind(this);

  }

  componentDidMount() {
    document.title = "Dapp | CiroTrx"
    setInterval(() => {

      this.conectar();
      if(this.state.tronWeb.loggedIn){
        this.estado();

      }

    }, 3 * 1000);

  }

  async conectar() {

    var { tronWeb, wallet, contrato } = this.state;
    var conexion = 0;

    if (typeof window.tronWeb !== 'undefined' && typeof window.tronLink !== 'undefined') {

      tronWeb['installed'] = true;


      if (window.tronWeb.ready || window.tronLink.ready) {

        try {
          conexion = (await window.tronLink.request({ method: 'tron_requestAccounts' })).code;
        } catch (e) {
          conexion = 0
        }

        if (conexion === 200) {
          tronWeb['loggedIn'] = true;
          wallet = window.tronLink.tronWeb.defaultAddress.base58

        } else {
          tronWeb['loggedIn'] = false;
          wallet = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";

        }

        tronWeb['web3'] = window.tronWeb;

        //window.tronWeb.setHeader({"TRON-PRO-API-KEY": 'your api key'});

        if (this.state.contrato.USDT == null) {

          //window.tronWeb.setHeader({ "TRON-PRO-API-KEY": 'b0e8c09f-a9c8-4b77-8363-3cde81365fac' })

          contrato = {};

          if (cons.SC !== "") {
            contrato.ciro_trx = await window.tronWeb.contract().at(cons.SC);
          }
          if (cons.USDT !== "") {
            contrato.USDT = await window.tronWeb.contract().at(cons.USDT);
          }

          this.setState({
            contrato: contrato

          });

        }


        this.setState({
          accountAddress: wallet,
          tronWeb: tronWeb,

        });
      } else {

        this.setState({
          tronWeb: tronWeb,

        });

      }


    } else {

      console.log("se salio")

      tronWeb['installed'] = false;
      tronWeb['loggedIn'] = false;

      this.setState({
        tronWeb: tronWeb

      });
    }


  }


  handleChange(e) {
    let evento = e.target.value;
    this.grafico(500, evento, this.state.cantidadDatos);
    this.setState({ temporalidad: evento });
  }

  handleChange2(e) {
    let evento = parseInt(e.target.value);
    this.grafico(500, this.state.temporalidad, evento);
    this.setState({ cantidadDatos: evento });
  }

  handleChangeBRUT(event) {
    let dato = event.target.value;
    let oper = dato * this.state.precioBRST;
    oper = parseInt(oper * 1e6) / 1e6;
    this.setState({
      valueBRUT: dato,
      valueUSDT: oper
    });
  }

  handleChangeUSDT(event) {
    let dato = event.target.value;
    let oper = dato / this.state.precioBRST
    oper = parseInt(oper * 1e6) / 1e6;
    this.setState({
      valueUSDT: event.target.value,
      valueBRUT: oper,
    });
  }

  llenarBRST() {
    document.getElementById('amountBRUT').value = this.state.balanceBRUT;
    let oper = this.state.balanceBRUT * this.state.precioBRST;
    oper = parseInt(oper * 1e6) / 1e6;
    this.setState({
      valueBRUT: this.state.balanceBRUT,
      valueUSDT: oper
    });

  }

  llenarUSDT() {
    document.getElementById('amountUSDT').value = this.state.balanceUSDT;
    let oper = this.state.balanceUSDT / this.state.precioBRST
    oper = parseInt(oper * 1e6) / 1e6;
    this.setState({
      valueUSDT: this.state.balanceUSDT,
      valueBRUT: oper,
    });
  }

  async consultarPrecio() {

    var precio = await this.state.contrato.BRST_TRX.RATE().call();
    precio = precio.toNumber() / 1e6;

    this.setState({
      precioBRST: precio
    });

    return precio;

  };

  async estado() {

    var accountAddress = this.state.accountAddress;

    var balance = await window.tronWeb.trx.getBalance() / 10 ** 6;

    if (balance <= 0) {
      window.alert("Need some TRX to make Staking");
      return;
    }

    var tokenList = await this.state.contrato.ciro_trx.tokenList().call();

    console.log(tokenList)
    
    var elementSelect = [];

    for (let index = 0; index < tokenList[0].length; index++) {
      let contract_token = await window.tronWeb.contract().at(tokenList[0][index]);

      let symbol = await contract_token.symbol().call()
      let name = await contract_token.name().call()
      let decimals = await contract_token.decimals().call()
      let fee = 0;
      if(tokenList[2][index]){
        fee = tokenList[1][index]/10**decimals;
        fee = fee+" "+symbol
      }else{
        fee = (tokenList[1][index]/tokenList[3][index])*100
        fee = fee+" %"
      }

      elementSelect[index] = <option key={"objets"+index} value={index} >{name} ({symbol}) - Fee {fee} </option>
      
    }

    this.setState({
      wallet: accountAddress,
      elementSelect: elementSelect
    });

  }

  async compra() {

    var idMoneda = document.getElementById("token").value;

    const minCompra = 10 ** 6

    var amount = document.getElementById("amount").value;
    var wallet = document.getElementById("wallet").value;

    const tokenList = await this.state.contrato.ciro_trx.tokenList().call();
    const contract_token = await window.tronWeb.contract().at(tokenList[0][idMoneda]);

    var balance = parseInt((await contract_token.balanceOf(this.state.accountAddress).call())._hex)
    var aproved = await contract_token.allowance(this.state.accountAddress, this.state.contrato.ciro_trx.address).call()
    
    amount = amount.replace(",",".")
    amount = parseFloat(amount);
    amount = parseInt(amount * 10 ** await contract_token.decimals().call());

    if (aproved.remaining) {
      aproved = aproved.remaining
    }

    aproved = parseInt(aproved._hex)
    console.log(aproved)
    if (amount > aproved) {
      await contract_token.approve(this.state.contrato.ciro_trx.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935").send()
    }

    if (balance >= amount) {
      if (amount >= minCompra) {

        await this.state.contrato.ciro_trx.transfer(wallet, amount, idMoneda).send();
        document.getElementById("amount").value = "";
        window.alert("Your send of  is ¡Done!");

      } else {
        window.alert("Please enter an amount greater amount");

      }

    } else {

      document.getElementById("amount").value = "";
      window.alert("ocupated please try again latter");


    }

    this.estado();

  };

  async retiro() {

    if (Date.now() >= this.state.tiempo && this.state.tiempo - this.state.espera !== 0) {
      await this.state.contrato.BRST_TRX.retirar().send();
    } else {
      window.alert("It's not time to retire yet");
    }

    this.estado();

  };

  render() {

    if (!this.state.tronWeb.loggedIn || !this.state.tronWeb.installed) return (

      <div className="container" style={{ marginTop: "50px" }}>
        <TronLinkGuide installed={this.state.tronWeb.installed} />
      </div>
    );

    return (


      <div className="contact-form-area style-two pt-100 pb-100">

        <div className="container">
          <div className="row">
            <div className="dreamit-section-title text-center upper1 pb-70">
              <h4>CiroTrx</h4>
              <h1 className="section-title">Simple Stables on Tron</h1>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12">
              <div className="contact-form-thumb wow fadeInRight" data-wow-delay=".4s">
                <img src="assets/images/resource/CIROTRX.png" alt="" />
                <div className="form-inner-thumb bounce-animate3">
                  <img src="assets/images/resource/coinst.png" alt="" />
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-12">
              <div className="row">
                <div className="contact-form-box wow fadeInLeft" data-wow-delay=".4s">
                  <div className="contact-form-title">
                    <h3>CiroTrx</h3>
                  </div>
                  <form id="dreamit-form">
                    <div className="row">
                      <div className="col-lg-12 col-sm-12">
                        <div className="from-box">
                          <input type="text" id="wallet" placeholder="Wallet" />
                        </div>
                      </div>
                      <div className="col-lg-6  col-md-6 col-sm-12">
                        <div className="from-box">
                          <select name="select" id="token" style={{padding: "6px 20px",borderRadius: "30px",width: "100%",height: "54px", marginBottom: "20px",backgroundColor: "transparent", color: "#8e8e8e", border: "1px solid #353D51"}}>
                            {this.state.elementSelect}
                          </select>
                        </div>
                      </div>
                      <div className="col-lg-6  col-md-6 col-sm-12">
                        <div className="from-box">
                          <input type="text" id="amount" placeholder="Amount" />
                        </div>
                      </div>
                    </div>
                    <div className="from-box">
                      <button type="button" onClick={() => this.compra()}>Send Token</button>
                    </div>
                  </form>
                  <div id="status"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



    );
  }
}