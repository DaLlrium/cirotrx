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
      elementSelect: <option value={0}>Loading...</option>


    };

    this.conectar = this.conectar.bind(this);

    this.compra = this.compra.bind(this);
    this.estado = this.estado.bind(this);

  }

  componentDidMount() {
    document.title = "Dapp | CiroTrx"
    setTimeout(async() => {

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
          conexion = (await window.tronLink.request({
            method: 'tron_requestAccounts', params: {
              websiteIcon: 'https://cirotrx.brutus.finance/assets/images/fav-icon/icon.png',
              websiteName: 'CiroTRX',
            }
          })).code;
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
      return;
    }

    var tokenList = await this.state.contrato.ciro_trx.tokenList().call();

    var elementSelect = [];

    for (let index = 0; index < tokenList[0].length; index++) {

      let contract_token = await window.tronWeb.contract().at(tokenList[0][index]);
      console.log(index)

      //

      if (contract_token.implementation && true) {//
        var address_imp = await contract_token.implementation().call()
        
        if (typeof address_imp !== "string" ) { address_imp = address_imp[0] }
        if (address_imp !== "410000000000000000000000000000000000000000") {
          let contract_imp = await window.tronWeb.contract().at(address_imp)
          contract_token = await window.tronWeb.contract(contract_imp.abi, tokenList[0][index]);
        }

      }

      let symbol = await contract_token.symbol().call();
      let name = await contract_token.name().call();
      let decimals = await contract_token.decimals().call();
      let fee = 0;
      if (tokenList[2][index]) {
        fee = tokenList[1][index];
        if(fee._hex){
          fee = fee._hex
        }

        fee = new BigNumber(fee).shiftedBy(-decimals).toString(10)
        fee = fee + " " + symbol
      } else {
        fee = (tokenList[1][index] / tokenList[3][index]) * 100
        fee = fee + " %"
      }

      elementSelect[index] = <option key={"objets" + index} value={index} >{name} ({symbol}) - Fee {fee} </option>

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

    amount = amount.replace(",", ".")
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
                <h1 className="section-title">Simple Stables on Tron</h1>
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
                          <p class="text-white">Recipient wallet</p>
                          <div className="from-box">
                            <input type="text" id="wallet" placeholder="Paste or enter the account address" />
                          </div>
                        </div>
                        <div className="col-lg-12 col-sm-12">
                          <p class="text-white">Choose a stablecoin</p>
                          <div className="from-box">
                            <select name="select" id="token" style={{ padding: "6px 20px", borderRadius: "30px", width: "100%", height: "54px", marginBottom: "20px", backgroundColor: "transparent", color: "#8e8e8e", border: "1px solid #353D51" }}>
                              {this.state.elementSelect}
                            </select>
                          </div>
                        </div>
                        <div className="col-lg-12 col-sm-12">
                          <p class="text-white">Amount</p>
                          <div className="from-box">
                            <input type="number" id="amount" placeholder="0" />
                          </div>
                        </div>
                        <div className="col-lg-12 col-sm-12 btn-group" role="group" aria-label="Porcentaje de envío">
                          <button type="button" class="btn btn-primary">25%</button>
                          <button type="button" class="btn btn-primary">50%</button>
                          <button type="button" class="btn btn-primary">75%</button>
                          <button type="button" class="btn btn-primary">100%</button>
                        </div>
                      </div>
                      <div className="from-box">
                        <button type="button" onClick={() => this.compra()}>Send </button>
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
