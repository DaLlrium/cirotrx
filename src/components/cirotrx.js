import React, { Component } from "react";
import cons from "../cons.js";

import TronLinkGuide from "./tronlink.js";

const BigNumber = require('bignumber.js');

function delay(s) { return new Promise(res => setTimeout(res, s * 1000)); }

export default class CiroTrx extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tronWeb: {
        loggedIn: false,
        installed: false
      },
      contrato: {
        ciro_trx: null
      },
      wallet: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
      elementSelect: <option value={0}>Loading...</option>,
      tokenSelected: "Loading...",
      disponible: 0,
      recivedAmount: 0,
      idMoneda: 0,

    };

    this.conectar = this.conectar.bind(this);

    this.compra = this.compra.bind(this);
    this.estado = this.estado.bind(this);
    this.opciones = this.opciones.bind(this);


  }

  componentDidMount() {
    document.title = "Dapp | CiroTrx"
    setTimeout(async () => {

      await this.conectar();
      if (this.state.tronWeb.loggedIn) {
        this.estado();

      }

    }, 3 * 1000);
    setInterval(() => {

      this.conectar();
      if (this.state.tronWeb.loggedIn) {
        this.estado();

      }

    }, 30 * 1000);

  }

  async conectar() {

    var { tronWeb, wallet, contrato } = this.state;
    var conexion = 0;

    if (typeof window.tronWeb !== 'undefined' && typeof window.tronLink !== 'undefined') {

      tronWeb['installed'] = true;


      if (window.tronWeb.ready || window.tronLink.ready) {

        try {
          conexion = (await window.tronLink.request({method: 'tron_requestAccounts'})).code;
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

          window.tronWeb.setHeader({ "TRON-PRO-API-KEY": process.env.REACT_APP_APIKY })

          contrato = {};

          if (cons.SC !== "") {
            contrato.ciro_trx = await window.tronWeb.contract().at(cons.SC);
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

      tronWeb['installed'] = false;
      tronWeb['loggedIn'] = false;

      this.setState({
        tronWeb: tronWeb

      });
    }
  }

  async estado() {

    var accountAddress = this.state.accountAddress;

    var balance = await window.tronWeb.trx.getBalance() / 10 ** 6;

    if (balance <= 0) {
      window.alert("Need some TRX to pay bandwidth");
    }

    var tokenList = await this.state.contrato.ciro_trx.tokenList().call();

    var idMoneda = document.getElementById("token").value;

    if(parseInt(idMoneda)> 0){
      idMoneda = 0
    }

    var elementSelect = [];

    var tokenContratos = [];

    var fees = [];

    for (let index = 0; index < tokenList[0].length; index++) {

      let contract_token = await window.tronWeb.contract().at(tokenList[0][index]);

      if (contract_token.implementation && true) {//
        var address_imp = await contract_token.implementation().call()

        if (typeof address_imp !== "string") { address_imp = address_imp[0] }
        if (address_imp !== "410000000000000000000000000000000000000000") {
          let contract_imp = await window.tronWeb.contract().at(address_imp)
          contract_token = await window.tronWeb.contract(contract_imp.abi, tokenList[0][index]);
        }

      }

      tokenContratos.push(contract_token)

      let symbol = await contract_token.symbol().call();
      let name = await contract_token.name().call();
      let decimals = await contract_token.decimals().call();
      let fee = 0;
      if (tokenList[2][index]) {
        fee = tokenList[1][index];
        if (fee._hex) {
          fee = fee._hex
        }

        fee = new BigNumber(fee).shiftedBy(-decimals)
        fees.push(fee.toNumber())
        
        fee = fee.toString(10) + " " + symbol
      } else {
        fee = (tokenList[1][index] / tokenList[3][index]) * 100
        fees.push(fee)

        fee = fee + " %"
      }

      elementSelect[index] = <option key={"objets" + index} value={index}>{symbol} ({name}) - Fee {fee} </option>

    }

    var decimals2 = await tokenContratos[idMoneda].decimals().call()
    var disponible = await tokenContratos[idMoneda].balanceOf(this.state.accountAddress).call()
    if(disponible._hex){
      disponible = disponible._hex
    }
    disponible = new BigNumber(disponible).shiftedBy(-decimals2)

    this.setState({
      wallet: accountAddress,
      elementSelect: elementSelect,
      tokenSelected: await tokenContratos[idMoneda].symbol().call(),
      tokenContratos: tokenContratos,
      fees: fees,
      disponible: disponible.toNumber()
    });

  }

  async opciones() {

    var tokenContratos = this.state.tokenContratos;

    var fees = this.state.fees;

    var idMoneda = document.getElementById("token").value;

    var disponible = await tokenContratos[idMoneda].balanceOf(this.state.accountAddress).call()
    if(disponible._hex){
      disponible = disponible._hex
    }

    var decimals2 = await tokenContratos[idMoneda].decimals().call()
    disponible = new BigNumber(disponible).shiftedBy(-decimals2)

    var amount = document.getElementById("amount").value;
    amount = amount.replace(",",".")
    amount = new BigNumber(document.getElementById("amount").value);


    if(amount.toNumber() > disponible.toNumber()){
      amount = disponible
      document.getElementById("amount").value = disponible.toString(10)
    }

    if(amount > fees[idMoneda]){
      amount = amount.minus(fees[idMoneda])

    }else{
      amount = 0
    }

    this.setState({
      tokenSelected: await tokenContratos[idMoneda].symbol().call(),
      disponible: disponible.toString(10),
      recivedAmount: amount.toString(10),
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

    amount = amount.replace(",", ".")
    amount = parseFloat(amount);
    amount = parseInt(amount * 10 ** await contract_token.decimals().call());

    if (aproved.remaining) {
      aproved = aproved.remaining
    }

    aproved = parseInt(aproved._hex)

    if (amount > aproved) {
      await contract_token.approve(this.state.contrato.ciro_trx.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935").send()
    }

    if (balance >= amount) {
      if (amount >= minCompra) {

        var result = await this.state.contrato.ciro_trx.transfer(wallet, amount, idMoneda).send();
        await delay(3)
        result = await window.tronWeb.trx.getTransaction(result);

        if (result.ret[0].contractRet === "SUCCESS") {
          window.alert("Your send of  is ¡Done!");
        } else {
          window.alert("Transaction Failed!");
        }
        document.getElementById("amount").value = "";


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

      <>

        <div className="contact-form-area style-two pt-100 pb-100">

          <div className="container">
            <div className="row">
              <div className="dreamit-section-title text-center upper1 pb-70">
                <h4>CiroTrx</h4>
                <h1 className="section-title">Stablecoin on TRON made simple</h1>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 col-md-6 col-sm-12">
                <div className="contact-form-thumb wow fadeInRight" data-wow-delay=".4s">
                  <img src="assets/images/resource/CIROTRX.png" alt="" />
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
                          <p className="text-white">Recipient wallet</p>
                          <div className="from-box">
                            <input type="text" id="wallet" placeholder="Paste or enter the account address" />
                          </div>
                        </div>
                        <div className="col-lg-12 col-sm-12">
                          <p className="text-white">Choose a stablecoin</p>

                          <div className="from-box">
                            <div className="row">
                              <div className="col-2">
                                <img className="" style={{margin: "7px 20px", width:"35px", height:"35px"}}  src={"assets/images/"+this.state.tokenSelected+"-logo.png"} alt={this.state.tokenSelected+"-logo"} />
                              </div>
                              <div className="col-10">
                                <select name="select" id="token" onChange={()=>{this.opciones()}} style={{ padding: "6px 20px", borderRadius: "30px", width: "100%", height: "54px", marginBottom: "20px", backgroundColor: "transparent", color: "#8e8e8e", border: "1px solid #353D51" }}>
                                  {this.state.elementSelect}
                                </select>
                              </div> 
                            </div>

                          </div>

                        </div>
                        <div className="col-lg-12 col-sm-12">
                          <p className="text-white">Amount</p>
                          <div className="from-box">
                            <input type="number" id="amount" onChange={()=>{this.opciones()}} placeholder="0" min={0} />
                          </div>
                          <p className="" style={{ fontSize: "0.9rem", color: "#808080" }}>Available: {this.state.disponible} {this.state.tokenSelected}</p>
                        </div>
                        <div className="col-lg-12 col-sm-12 btn-group" role="group" >
                          <button type="button" className="btn btn-success" onClick={()=>{ document.getElementById("amount").value = ((this.state.disponible)*0.25).toPrecision(6); this.opciones()}} style={{ marginRight: "7px", borderRadius: "10px", backgroundColor: "#1DD1A1" }}>25%</button>
                          <button type="button" className="btn btn-success" onClick={()=>{ document.getElementById("amount").value = ((this.state.disponible)*0.50).toPrecision(6); this.opciones()}} style={{ marginRight: "7px", borderRadius: "10px", backgroundColor: "#1DD1A1" }}>50%</button>
                          <button type="button" className="btn btn-success" onClick={()=>{ document.getElementById("amount").value = ((this.state.disponible)*0.75).toPrecision(6); this.opciones()}} style={{ marginRight: "7px", borderRadius: "10px", backgroundColor: "#1DD1A1" }}>75%</button>
                          <button type="button" className="btn btn-success" onClick={()=>{ document.getElementById("amount").value = ((this.state.disponible)*1).toPrecision(6); this.opciones()}} style={{ borderRadius: "10px", backgroundColor: "#1DD1A1" }}>100%</button>

                        </div>
                      </div>
                      <div className="from-box">
                        <p className="text-white text-center">Recived amount: {this.state.recivedAmount} {this.state.tokenSelected}</p>
                        <button type="button" style={{ width: "100%" }} onClick={async() => {await this.opciones();this.compra()}}>Send</button>
                      </div>
                    </form>
                    <div id="status"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </>

    );
  }
}
