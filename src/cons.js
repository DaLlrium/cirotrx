var proxy = "https://cors.brutusservices.com/";

const conProxy = true;

if(!conProxy)proxy = "";

const PRICE = proxy+process.env.REACT_APP_API_URL+"api/v1/precio/BRUT"; //API de precio


var SC = "TBRVNF2YCJYGREKuPKaP7jYYP9R1jvVQeq";//contrato CiroTRX

var USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";//token USDT

const testnet = true;//shasta

if(testnet){

    SC = "TRxxZV3t7bSx1NACMN5QmTfsjBTonQ486F";//ciro TRX

    USDT = "TExwHCjZYbb7ToQUfQY5JgumwbcXAgeaVd";//token USDT

}

export default {proxy, SC, USDT, PRICE};
