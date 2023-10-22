import React, { Component } from "react";
import cons from "../cons.js";

import TronLinkGuide from "./tronlink.js";

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
    setInterval(() => {

      this.conectar();
      if (this.state.tronWeb.loggedIn) {
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
          conexion = (await window.tronLink.request({ method: 'tron_requestAccounts', params: {
            websiteIcon: 'https://cirotrx.brutus.finance/assets/images/fav-icon/icon.png',
            websiteName: 'CiroTRX',
          } })).code;
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

      let symbol = await contract_token.symbol().call()
      let name = await contract_token.name().call()
      let decimals = await contract_token.decimals().call()
      let fee = 0;
      if (tokenList[2][index]) {
        fee = tokenList[1][index] / 10 ** decimals;
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

        <div id="sticky-header" className="cryptobit_nav_manu">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-4">
                <div className="logo">
                  <a className="logo_img" href="/" title="cryptobit">
                    <img src="assets/images/cirotrxlogo.png" alt="" />
                  </a>
                  <a className="main_sticky" href="/" title="cryptobit">
                    <img src="assets/images/cirotrxlogo.png" alt="astute" />
                  </a>
                </div>
              </div>
              <div className="col-lg-8">
                <nav className="cryptobit_menu">
                  <ul className="nav_scroll">
                    <li><a href="/#home">Home</a></li>
                    <li><a href="/#what">What is Cirotrx?</a></li>
                    <li><a href="/#about">About us</a></li>
                    <li><a href="/#contact">Contact</a></li>
                  </ul>
                  <div className="header-button">
                    <a href="/">Back to the home page</a>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>


        <div className="mobile-menu-area d-sm-block d-md-block d-lg-none ">
          <div className="mobile-menu">
            <nav className="cripto_menu">
              <ul className="nav_scroll">
                <li><a href="/#home">Home</a></li>
                <li><a href="/#what">What is Cirotrx?</a></li>
                <li><a href="/#about">About us</a></li>
                <li><a href="/#contact">Contact</a></li>
                <li>
                  <div className="header-button">
                    <a href="/">Back to the home page</a>
                  </div></li>

              </ul>
            </nav>
          </div>
        </div>


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
                            <select name="select" id="token" style={{ padding: "6px 20px", borderRadius: "30px", width: "100%", height: "54px", marginBottom: "20px", backgroundColor: "transparent", color: "#8e8e8e", border: "1px solid #353D51" }}>
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

      </>

    );
  }
}
