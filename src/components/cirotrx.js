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
      wallet: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb"


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

    var MIN_DEPOSIT = await this.state.contrato.BRST_TRX.MIN_DEPOSIT().call();
    MIN_DEPOSIT = parseInt(MIN_DEPOSIT._hex) / 10 ** 6;

    var aprovadoBRUT = await this.state.contrato.BRST.allowance(accountAddress, this.state.contrato.BRST_TRX.address).call();
    aprovadoBRUT = parseInt(aprovadoBRUT._hex);

    var balanceBRUT = await this.state.contrato.BRST.balanceOf(accountAddress).call();
    balanceBRUT = parseInt(balanceBRUT._hex) / 10 ** 6;

    if (aprovadoBRUT > 0) {
      aprovadoBRUT = "Sell ";
    } else {
      aprovadoBRUT = "Approve Exchange";
      this.setState({
        valueBRUT: ""
      })
    }

    var precioBRST = await this.consultarPrecio();

    var deposito = await this.state.contrato.BRST_TRX.todasSolicitudes(accountAddress).call();

    var myids = []
    var myidsAll = []

    for (let index = 0; index < deposito.completado.length; index++) {
      if (!deposito.completado[index]) {
        myids.push(parseInt(deposito.id[index]._hex));
      }

      myidsAll.push(parseInt(deposito.id[index]._hex));

    }


    var deposits = await this.state.contrato.BRST_TRX.solicitudesPendientesGlobales().call();
    var globDepositos = [];

    var tiempo = (await this.state.contrato.BRST_TRX.TIEMPO().call()).toNumber() * 1000;
    var diasDeEspera = (tiempo / (86400 * 1000)).toPrecision(2)

    for (let index = 0; index < deposits.length; index++) {

      let pen = await this.state.contrato.BRST_TRX.verSolicitudPendiente(parseInt(deposits[index]._hex)).call();
      let inicio = pen[1].toNumber() * 1000

      let pv = new Date(inicio)

      let diasrestantes = ((inicio + tiempo - Date.now()) / (86400 * 1000)).toPrecision(2)

      var boton = <></>
      var boton2 = <><p className="mb-0 fs-14 text-white">Order in UnStaking process for the next 14 days, once this period is over, return and claim the corresponding TRX</p></>;

      if (diasrestantes > 14 || this.state.accountAddress === window.tronWeb.address.fromHex((await this.state.contrato.BRST_TRX.owner().call()))) {

        boton2 = <button className="btn  btn-success text-white mb-2" onClick={async () => {
          if (this.state.balanceUSDT * 1 >= parseInt(pen[2]._hex) / 10 ** 6) {
            await this.state.contrato.BRST_TRX.completarSolicitud(parseInt(deposits[index]._hex)).send({ callValue: parseInt(pen[2]._hex) });
            this.consultarPrecio();
            this.estado();
            window.alert("Order completed!")
          } else {
            window.alert("Insufficient balance to fulfill this order")
          }

        }}>
          Complete order {" "} <i className="bi bi-check-lg"></i>
        </button>

      }

      if (myids.includes(parseInt(deposits[index]._hex)) && diasrestantes >= 16.75) {
        boton = (<>
          <button className="btn btn-danger ms-4 mb-2" title="You only have 24 hours to cancel your order after this time you will not be able to cancel it" onClick={async () => {
            await this.state.contrato.BRST_TRX.completarSolicitud(parseInt(deposits[index]._hex)).send({ callValue: 0 });
            this.estado()
          }}>
            Cancel {" "} <i className="bi bi-x-lg"></i>
          </button>
          <p className="mb-0 fs-14">You only have 6 hours to cancel your order after this time you will not be able to cancel it</p>
        </>)
      }

      if (myids.includes(parseInt(deposits[index]._hex)) && diasrestantes < 16.75 && diasrestantes > 0) {
        boton = (
          <button className="btn btn-warning ms-4 mb-2 disabled" aria-disabled="true" >
            Claim {" "} <i className="bi bi-exclamation-circle"></i>
          </button>
        )
      }

      if (myids.includes(parseInt(deposits[index]._hex)) && diasrestantes <= 0) {

        console.log(myidsAll.indexOf(parseInt(deposits[index]._hex)))
        boton = (
          <button className="btn btn-primary ms-4 mb-2" aria-disabled="true" onClick={async () => {
            await this.state.contrato.BRST_TRX.retirar(myidsAll.indexOf(parseInt(deposits[index]._hex))).send();
            this.estado()
          }}>
            Claim {" "} <i className="bi bi-award"></i>
          </button>
        )
      }

      if (diasrestantes <= 0) {
        diasrestantes = 0
      }

      globDepositos[deposits.length - 1 - index] = (

        <div className="row mt-4 align-items-center" key={"glob" + parseInt(deposits[index]._hex)}>
          <div className="col-sm-3 mb-3">
            <p className="mb-0 fs-14">Sale N° {parseInt(deposits[index]._hex)} | <span style={{ color: "white" }}>{diasrestantes} Days left</span> </p>
            <h4 className="fs-20 text-black">{parseInt(pen[3]._hex) / 10 ** 6} BRST X {parseInt(pen[2]._hex) / 10 ** 6} TRX</h4>
          </div>
          <div className="col-sm-6 mb-1">

            {boton2}
            {boton}
          </div>
          <div className="col-12 mb-3">
            <p className="mb-0 fs-14"><span className="text-white">Application date:</span> {pv.toString()}</p>
            <hr></hr>
          </div>

        </div>
      )

    }

    var enBrutus = await this.state.contrato.BRST_TRX.TRON_BALANCE().call();
    var tokensEmitidos = await this.state.contrato.BRST.totalSupply().call();
    var enPool = await this.state.contrato.BRST_TRX.TRON_PAY_BALANCE().call();
    var solicitado = await this.state.contrato.BRST_TRX.TRON_SOLICITADO().call();


    this.setState({
      minCompra: MIN_DEPOSIT,
      globDepositos: globDepositos,
      depositoBRUT: aprovadoBRUT,
      balanceBRUT: balanceBRUT,
      balanceUSDT: balance,
      wallet: accountAddress,
      precioBRST: precioBRST,
      espera: tiempo,
      enBrutus: enBrutus.toNumber() / 1e6,
      tokensEmitidos: tokensEmitidos.toNumber() / 1e6,
      enPool: enPool.toNumber() / 1e6,
      solicitado: solicitado.toNumber() / 1e6,
      solicitudes: globDepositos.length,
      dias: diasDeEspera
    });

  }

  async compra(moneda) {

    const minCompra = 1

    var amount = document.getElementById("amount"+moneda).value;
    var wallet = document.getElementById("wallet"+moneda).value;

    amount = parseFloat(amount);
    amount = parseInt(amount * 10 ** 6);

    console.log(amount)

    var balance = 100000000000000 // balance en USDT

    if (balance >= amount) {
      if (amount >= minCompra) {

        await this.state.contrato.ciro_trx.transfer(wallet,amount).send();
        document.getElementById("amount"+moneda).value = "";
        window.alert("Your send of  is ¡Done!");

      } else {
        window.alert("Please enter an amount greater amount");

      }

    } else {

      document.getElementById("amount"+moneda).value = "";
      window.alert("ocupated please wait");


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

      <div className="container" style={{marginTop: "50px"}}>
        <TronLinkGuide installed={this.state.tronWeb.installed} />
      </div>
    );

    var { minCompra, minventa } = this.state;

    minCompra = minCompra + " USDT";
    minventa = minventa + " USDT";

    return (

      <div className="clearfix" style={{ "clear": "both" }}>
        <div id="home" className="hero-section">
          <div className="container">

            <div className="row mx-0">

              <div className="col-xl-6 col-xxl-12">
                <div className="card">
                  <div className="card-header d-sm-flex d-block pb-0 border-0">
                    <div>
                      <h4 className="fs-20" style={{ color: "black" }}>SEND USDT</h4>

                    </div>

                  </div>
                  <div className="card-body">
                    <div className="basic-form">
                      <form className="form-wrapper">
                        <div className="form-group">
                          <div className="input-group input-group-lg">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ cursor: "pointer" }} onClick={() => this.llenarUSDT()} >USDT: {this.state.balanceUSDT}</span>
                            </div>
                            <input type="number" className="form-control" style={{color: "black"}} id="amountUSDT" onChange={this.handleChangeUSDT} placeholder={minventa} min={this.state.minventa} max={this.state.balanceBRUT} value={this.state.valueUSDT} />
                          </div>
                        </div>
                        <div className="form-group">
                          <div className="input-group input-group-lg">
                            <div className="input-group-prepend">
                              <span className="input-group-text " style={{ cursor: "pointer" }} >FEE USDT: </span>
                            </div>
                            <input type="number" className="form-control" style={{color: "black"}} id="amountBRUT" onChange={this.handleChangeBRUT} placeholder={minCompra} value={this.state.valueBRUT} readOnly />
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <div className="input-group input-group-lg">
                            <div className="input-group-prepend">
                              <span className="input-group-text" style={{ cursor: "pointer" }} >Wallet:</span>
                            </div>
                            <input type="text" className="form-control" style={{color: "black"}} id="walletUSDT" placeholder={"Tkd....AWdga"} />
                          </div>
                        </div>
                        <div className="row mt-4 align-items-center">
                          <div className="col-sm-6 mb-3">
                            <p className="mb-0 fs-14">We recommend keeping ~1 TRX or <a href="?ebot"> ~400 bandwidth</a> to send USDT</p>
                          </div>
                          <div className="col-sm-6 text-sm-right text-start">
                            <div className="btn  btn-success text-white mb-2" onClick={() => this.compra("USDT")}>
                              SEND {"->"}
                              
                            </div>


                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>


            </div>

          </div>
        </div>
      </div>

    );
  }
}
