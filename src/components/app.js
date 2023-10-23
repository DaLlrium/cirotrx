import React, { Component } from "react";

import Inicio from "./inicio.js";

import Cirotrx from "./cirotrx.js";


class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      accountAddress:"T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
      tronWeb: {
        installed: false,
        loggedIn: false,
        web3: null
      },
      contrato: {
        BRUT_USDT: null,
        BRUT: null,
        MBOX: null,
        loteria: null,
        BRLT: null,
        USDT: null,
        BRGY: null,
        BRST: null,
        BRST_TRX: null,
        
      }
    };

  }

  async componentDidMount() {

  }

  render(){

    let url = window.location.href;

    if(url.indexOf("/?") >= 0 )url = (url.split("/?"))[1];
    if(url.indexOf("&") >= 0 )url = (url.split("&"))[0];

    switch (url) {

      case "dapp":

        var clases = document.getElementsByClassName("tiemMenu")

        for (let index = 0; index < clases.length; index++) {
          console.log(clases[index].href)
          let url = (clases[index].href).replace("?dapp","")
          clases[index].href = url;
          
        }

        var clases2 = document.getElementsByClassName("conectDapp")

        for (let index = 0; index < clases2.length; index++) {
          clases2[index].innerHTML = "Back to the home page";
          
        }

        return <Cirotrx accountAddress={this.state.accountAddress} contrato={this.state.contrato} />
    
      default:
        return <Inicio accountAddress={this.state.accountAddress} contrato={this.state.contrato}/>
    }

  }
  
}
export default App;
