rush = window.rush = {

    "passcode": "",
    "address": "",
    "explorerlink": "",
    "txSec": "",
    "balance": 0,
    "txUnspent": "",
    "txValue": 0,
    "txFee": 0.0001,
    "txAmount": .001,
    "txDest": "",
    "counter": 0,
    "encrypted": false,
    "gpgPrivate": "",
    "gpgPublic": "",
    "gpgKeys": Array(),
    "gpgPage": Array(),
    "price": 0,
    "currency": "USD",
    "useFiat": false,
    "useFiat2": false,
    "firstTime":false,
    "currency": "USD",
    "currencyOptions": ["AUD","BRL","CAD","CHF","CNY","DKK","EUR","GBP","HKD","INR", "ISK", "JPY","KRW","NZD","PLN","RUB","SEK","SGD","TWD","USD","ZAR","BTC","mBTC","bits","Gold (ozt)","Silver (ozt)","Gold (g)","Silver (g)"],
    //"currencyOptions": ["AUD","BRL","CAD","CHF","CNY","DKK","EUR","GBP","HKD","INR", "ISK", "JPY","KRW","NZD","PLN","RUB","SEK","SGD","TWD","USD","ZAR"],
    "getBalanceBlock": false,

    "open": function ()
    {
        if (typeof Android !== "undefined") {
            Android.showToast("Make sure you save your Private Keys somewhere safe. Go to Settings -> Export Private Keys to display them.");
        }

        if ( readCookie("currency") != "" )
        {
            this.currency = readCookie("currency");
        }

        if ( readCookie("txFee") != "" )
        {
            this.txFee = readCookie("txFee");
        }

        $("#wallet, #txList").show();
        $("#generate").hide();

        //$("#address").html(this.address);
        $("#address").html("<a href=\"http://insight-myr.cryptap.us/address/"+this.address+"\" target=\"_blank\">"+this.address+"</a>");
        $("#explorerlink").html("<a href=\"http://insight-myr.cryptap.us/address/" + this.address + "\" target=\"_blank\">cryptap.us block explorer (new tab)</a>");

        $(".qrimage").attr("src", "https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=myriadcoin%3A" + this.address + "&chld=H|0")

        rush.getBalance();

        var socket = new WebSocket("wss://ws.blockchain.info/inv");

        socket.onopen = function (msg)
        {
            var message = {
                "op": 'addr_sub',
                "addr": rush.address
            };


            socket.send(JSON.stringify(message));
        }

        socket.onmessage = function (msg)
        {
            //console.log(msg);
            setTimeout(function ()
            {
                if ( !rush.getBalanceBlock )
                {
                    rush.getBalance();
                    playBeep();
                }

            }, 500);
        }

        //url = "https://rushwallet.com/?z=" + ( Math.floor(Math.random() * 9999999) + 1 ) + "#" + rush.passcode + "&{CODE}";
        url = "https://cryptap.us/myr/jswallet/?z=" + ( Math.floor(Math.random() * 9999999) + 1 ) + "#" + rush.passcode + "&{CODE}";
        //url2="zxing://scan/?ret=" + encodeURIComponent( url ) + "&SCAN_FORMATS=QR";
        //console.log( url);
        $("#qrlink").attr('href', '');


        if ( rush.firstTime )
        {
/*            $("#saveURLHolder, #saveURL").show();

            setTimeout( function()
            {
                $("#saveURL").slideUp();

            }, 7000);
*/
            //ga( "send", "event", "Create", "Wallet" );

        }        
        else
        {
            //ga( "send", "event", "Open", "Wallet" );

        }
    

        // this.getHistory();
        
        // if ( rush.lastTab == "gpg" )
        // {
        //     setTimeout(function ()
        //     {
        //         rush.openGpgTab();
        //     }, 200);
        // }

        setInterval( function()
        {
            rush.getFiatPrice();
        }, 300000);
        
		setInterval( function()
        {
            rush.getBalance();
        }, 120000);


    },

   
    "check": function ()
    {

        if ( this.useFiat )
        {
            var amount = parseFloat($("#txtAmount").val()) / this.price;
        }
        else
        {
            var amount = $("#txtAmount").val();   
        }

        if (amount > this.balance)
        {
            setMsg("You are trying to send more BTC than you have in your balance!");
            return false;
        }
        
        //console.log( "total: " + (parseFloat(amount) + parseFloat(this.txFee)) + " balance: " + this.balance);

        total = parseFloat(amount) + parseFloat(this.txFee);

        total = btcFormat( total );

        if (total > this.balance)
        {
            //setMsg("You need to leave enough room for the " + this.txFee + " btc miner fee");
            setMsg("You need to leave enough room for the " + this.txFee + " XMY miner fee");
            return false;
        }

        if (parseFloat(amount) <= 0)
        {
            setMsg("Please enter an amount!");

            return false;
        }

        if ( !this.checkAddress( $('#txtAddress').val() ) )
        {
            setMsg("Invalid address!");

            return false;
        }

       return true;
    },
    "checkAddress": function ( address )
    {
        try
        {
            var res = Bitcoin.base58.checkDecode(address);
            var version = res.version
            var payload = res.slice(0);
            //if (version == 0 || version == 5 )
            //    return true;
			//return true;
			// Check if push to privkkey, multisig doesn't work yet!:
			if (address.charAt(0)=='M') 
				return true;
        }
        catch (err)
        {
            return false;
        }
    },
    "send": function ()
    {
        if (!this.check())
        {
            return;
        }

        if (this.encrypted)
        {

            if ($("#password").val() == "")
            {
                setMsg("Your wallet is encrypted. Please enter a password.");
            }

            var passcode = CryptoJS.AES.decrypt(this.passcode, $("#password").val());

            var passcode = passcode.toString(CryptoJS.enc.Utf8);

            if (!passcode)
            {
                setMsg("Wrong Password!");
                return;
            }

        }
        else
        {
            var passcode = this.passcode;
        }

        var bytes = Bitcoin.Crypto.SHA256(passcode,
        {
            asBytes: true
        });

        var btcKey = new Bitcoin.Key(bytes);

        this.txSec = btcKey.export("base58");
        
        if ( this.useFiat )
        {
            var btcValue = parseFloat($("#txtAmount").val()) / this.price;
            btcValue = btcFormat( btcValue );
            this.txAmount = btcValue;

        }
        else
        {
            this.txAmount = parseFloat($("#txtAmount").val());
            this.txAmount = btcFormat( this.txAmount );
        }

        this.txDest = $('#txtAddress').val();
        txGetUnspent();

        $("#sendBtn").attr("disabled", "disabled");
        $("#sendBtn").html("Sending...");
        $("#fiatPrice").hide();
    },
    "generate": function ()
    {

        $("#txtReceiveAmount").blur();
        $('html, body').animate({ scrollTop: 0 }, 'fast');


        setTimeout( function () {

            $("#request").modal("show");
            rush.generateNow();

        }, 1000);

       

        
    },
    "generateNow": function ()
    {
        amount = $("#txtReceiveAmount").val();

        //$("#receiveQR").attr("src", "https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=bitcoin%3A" + this.address + "%3Famount%3D" + amount + "&chld=H|0");
        $("#receiveQR").attr("src", "https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=myriadcoin%3A" + this.address + "%3Famount%3D" + amount + "&chld=H|0");

        if ( this.useFiat2 )
        {
            amount = parseFloat( amount ) / this.price;
            amount = btcFormat( amount );
        }

        $("#generateAmount").html(amount);

        $("#generateAddress").html( this.address );
    },
    "getHistory": function ()
    {
        //var url = "https://btc.blockr.io/api/v1/address/txs/" + this.address;
        var url = "https://cryptap.us/myr/insight/api/txs/?address=" + this.address;
	var thisaddr = this.address;

        $("#txTable tbody").html("");

        $.ajax(
        {
            type: "GET",
            url: url,
            async: true,
            dataType: "json",
            data:
            {}

        }).done(function (msg)
        {
		//console.log(msg);
            //if ( msg.data.txs.length > 0 )
            if ( msg.txs.length > 0 )
            {
                $("#txBox").show();
                $("#noTx, #txList .break").hide();
            }

            //for ( i in msg.data.txs )
            //for ( i=0;i<msg.data.txs.length;i++ )
            for ( i=0;i<msg.txs.length;i++ )
            {
                //txTime = moment( msg.data.txs[i].time_utc ).format( "MMM D YYYY [<span class='time'>]h:mma[</span>]" );
                txTime = moment( msg.txs[i].time*1000 ).format( "MMM D YYYY [<span class='time'>]h:mma[</span>]" );
                if ( txTime == 'Invalid date' ) { txTime = 'unconfirmed'; }

		// Attempt to calculate value:
		txs = msg.txs[i];
		// get input if they are not ours:
		satin=0;
		for (ins=0;ins<txs.vin.length;ins++ )
		{
			if (thisaddr != txs.vin[ins].addr) {
				satin = satin+parseFloat(txs.vin[ins].value);
			}
		}
		// get outputs if they are not ours:
		satout=0;
		for (outs=0;outs<txs.vout.length;outs++ )
		{
			if (thisaddr != txs.vout[outs].scriptPubKey.addresses[0]) {
				satout = satout+parseFloat(txs.vout[outs].value);
			}
		}
		tot = satin-satout;
		//console.log('ins is: '+satin);
		//console.log('outs is: '+satout);
		//console.log('Total is: '+tot);
		// if total is less than zero, it's outgoing and add fees:
		//if ( tot < 0.0 )
		//{
		//	tot = tot - txs.fees;
		//}
		tot = tot - txs.fees;
		tot = tot.toFixed(8);

                confirms = msg.txs[i].confirmations;
                if ( confirms == undefined ) { confirms = 0; }

                $("#txTable tbody").append( '<tr><td>' + txTime + '</td><td class="hidden-sm hidden-xs"><a href="http://insight-myr.cryptap.us/tx/' + msg.txs[i].txid + '" target="_blank" >' + msg.txs[i].txid.substring(0,30) + '...</a></td><td class="hidden-sm hidden-xs">' + confirms + '</td><td>' + tot + '</td></tr>' );
            }

            $("#txTable tbody tr td:nth-child(4)").each( function ( i ) 
            {
                if ( $(this).html() > 0 )
                {
                    $(this).css({color: "#F49500", "text-align":"right", "padding-right": "30px"});
                }
                else
                {
                    $(this).css({color: "#52B3EA", "text-align":"right", "padding-right": "30px"});

                }

            });



            rush.getUnconfirmed();
        });

    },  
    "setTxFee": function ( fee )
    {
        this.txFee = parseFloat( fee );
        setCookie( "txFee", parseFloat(fee), 100 );
    },
    "getUnconfirmed": function ()
    {
        //var url = "https://btc.blockr.io/api/v1/address/unconfirmed/" + this.address;
        var url = "https://cryptap.us/myr/insight/api/addr/" + this.address;

        $.ajax(
        {
            type: "GET",
            url: url,
            async: true,
            dataType: "json",
            data:
            {}

        }).done(function (msg)
        {
            unconfirmed = "";

            unconfirmedArr = Array();

            unconfirmedCount = 0;

            //console.log(msg);

            //for ( i in msg.data.unconfirmed )
            //{
            //    unconfirmedCount++;
            //    if ( unconfirmedArr[msg.data.unconfirmed[i].tx] == undefined )
            //    {
            //        unconfirmedArr[msg.data.unconfirmed[i].tx] = {};
            //    }
            //
            //    if ( unconfirmedArr[msg.data.unconfirmed[i].tx].amount == undefined )
            //    {
            //        unconfirmedArr[msg.data.unconfirmed[i].tx].amount = msg.data.unconfirmed[i].amount;
            //    }
            //    else
            //    {
            //        unconfirmedArr[msg.data.unconfirmed[i].tx].amount += msg.data.unconfirmed[i].amount;
            //    }
            //
            //    unconfirmedArr[msg.data.unconfirmed[i].tx].time_utc = msg.data.unconfirmed[i].time_utc;
            //}
            
            if ( msg.unconfirmedTxApperances > 0 )
            {
                unconfirmedCount++;
                if ( unconfirmedArr[1] == undefined )
                {
                    unconfirmedArr[1] = {};
                }

                if ( unconfirmedArr[1].amount == undefined )
                {
                    unconfirmedArr[1].amount = msg.unconfirmedBalance;
                }
                else
                {
                    unconfirmedArr[1].amount += msg.unconfirmedBalance;
                }

                unconfirmedArr[1].time_utc = 'unknown';
            }

            if ( unconfirmedCount > 0 )
            {
                $("#txBox").show();
                $("#noTx, #txList .break").hide();
            }
        

            for ( i in unconfirmedArr )
            {
                //txTime = moment( unconfirmedArr[i].time_utc ).format( "MMM D YYYY [<span class='time'>]h:mma[</span>]" );

                //unconfirmed += '<tr><td>' + txTime + '</td><td class="hidden-sm hidden-xs"><a href="https://blockchain.info/tx/' + i + '" target="_blank">' + i.substring(0,30) + '</a></td><td class="hidden-sm hidden-xs">0</td><td>' + btcFormat( unconfirmedArr[i].amount ) + '</td></tr>';
                //unconfirmed += '<tr><td>' + txTime + '</td><td class="hidden-sm hidden-xs"><a href="http://insight-myr.cryptap.us/tx/' + i + '" target="_blank">' + i.substring(0,30) + '</a></td><td class="hidden-sm hidden-xs">0</td><td>' + btcFormat( unconfirmedArr[i].amount ) + '</td></tr>';
            }


            $("#txTable tbody").prepend( unconfirmed );

            $("#txTable tbody tr td:nth-child(4)").each( function ( i ) 
            {
               if ( $(this).html() > 0 )
               {
                   $(this).css({color: "#F49500", "text-align":"right", "padding-right": "30px"});
               }
               else
               {
                   $(this).css({color: "#52B3EA", "text-align":"right", "padding-right": "30px"});

               }

            });



        });

    },

    "getBalance": function ()
    {
        //var url = "https://blockchain.info/q/addressbalance/" + this.address;
        //var url = "https://cryptap.us/myr/insight/api/addr/" + this.address + "/balance";
        //var url = "https://cryptap.us/myr/insight/api/addr/" + this.address;
		var url = 'https://cryptap.us/myr/insight/api/addr/' + this.address + '/utxo';

        $.ajax(
        {
            type: "GET",
            url: url,
            async: true,
            data:
            {}

        }).done(function (msg)
        {
			
			var b = 0.0;
			for (txindy in msg) {
				tx = msg[txindy];
				b += tx['amount'];
			}
			rush.balance = b;

            //rush.balance = msg / 100000000;
            //rush.balance = msg.balance + msg.unconfirmedBalance;
            var spendable = rush.balance - rush.txFee;

            if (spendable < 0)
                spendable = 0;

            $("#btcBalance").html( btcFormat( rush.balance ) );
            //$("#spendable").html("฿" + btcFormat( spendable ) );
            $("#spendable").html("ᵯ" + btcFormat( spendable ) );

            rush.getFiatPrice();

            setTimeout( function () {rush.getHistory()}, 1000);

        });



    },
    "getFiatPrefix": function()
    {
        switch ( this.currency )
        {
            case "AUD":
            case "USD":
            case "CAD":
            case "CLP":
            case "HKD":
            case "NZD":
            case "SGD":
                return "$";
                break;
            case "BRL":
                return "R$"; 
            case "CNY":
                return "¥";            
            case "DKK":
                return "kr";
            case "EUR":
                return "€";            
            case "GBP":
                return "£";            
            case "INR":
                return "";
            case "ISK":
                return "kr";            
            case "JPY":
                return "¥";
            case "KRW":
                return "₩";            
            case "PLN":
                return "zł";
            case "RUB":
                return "руб ";            
            case "SEK":
                return "kr ";
            case "TWD":
                return "NT$";
            case "BTC":
                return "฿";
            case "mBTC":
                return "m฿";
            case "bits":
                return "µ฿";
            case "Gold (ozt)":
                return "ozt ";
            case "Silver (ozt)":
                return "ozt ";
            case "Gold (g)":
                return "g ";
            case "Silver (g)":
                return "g ";

            default:
                return "$";
        }
    },
    "getFiatValue": function ()
    {
        this.fiatValue = this.price * rush.balance;

        $("#fiatValue").html( this.getFiatPrefix() + formatMoney(  this.fiatValue.toFixed(2) ) );

        $("#currentPrice").html( this.getFiatPrefix() + formatMoney(  rush.price.toFixed(2)  ));
    },
    "getFiatPrice": function ()
    {
        currency = this.currency;

        $.ajax({
            type: "GET",
            //url: "https://rushwallet.com/ticker2.php",
            url: "https://cryptap.us/myr/jswallet/ticker.php",
            async: true,
            data: {},
            dataType: "json"

        }).done(function (msg) {
            

			price = msg[currency].last;

            rush.price = price;
			tprice = price*1000;

            price = price.toFixed(2);
            tprice = tprice.toFixed(2);

            $("#price").html(rush.getFiatPrefix()+formatMoney(tprice) + " / 1kXMY").show();

            $("#currencyValue").html( rush.currency );

            rush.getFiatValue();


        });

    },
    "amountFiatValue": function ()
    {

        var amount = $("#txtAmount").val();

        amount = parseFloat(amount);

        if (!amount)
        {
            amount = 0;
        }

        
        if ( rush.useFiat )
        {
            var btcValue = amount / this.price;
            btcValue = btcFormat( btcValue );
            //$("#fiatPrice").html("(฿" + btcValue + ")");
            $("#fiatPrice").html("(ᵯ" + btcValue + ")");

        }
        else
        {
            var fiatValue = this.price * amount;

            fiatValue = fiatValue.toFixed(2);

            $("#fiatPrice").html("(" + this.getFiatPrefix() + formatMoney(fiatValue) + ")");
        }

    },
    "amountFiatValue2": function ()
    {

        var amount = $("#txtReceiveAmount").val();

        amount = parseFloat(amount);

        if (!amount)
        {
            amount = 0;
        }

        
        if ( rush.useFiat2 )
        {
            var btcValue = amount / this.price;
            btcValue = btcFormat( btcValue );
            //$("#fiatPrice2").html("(฿" + btcValue + ")");
            $("#fiatPrice2").html("(ᵯ" + btcValue + ")");

        }
        else
        {
            var fiatValue = this.price * amount;

            fiatValue = fiatValue.toFixed(2);

            $("#fiatPrice2").html("(" + this.getFiatPrefix() + formatMoney(fiatValue) + ")");
        }

    },
    "prepareReset": function ()
    {
        setMsg("Are you sure you want to generate a new address? <strong>This will delete your current one and all funds associated with it.</strong> <br/><button id='confirmReset'>Yes</button> <button id='noReset'>No</button>");
    },
    "reset": function ()
    {


        $("#errorBox").hide();

        // chrome.storage.local.set(
        // {
        //     'encrypted': false
        // }, function () {});

        $("#balanceBox").hide();
        $("#password").hide();
        $("#preparePassword").show();
        this.encrypted = false;
        this.passcode = "";
        this.address = "";
        this.txSec = "";
        entroMouse.string = "";
        entroMouse.start();

    },
    
    "txComplete": function ()
    {
  
        //ga( "send", "event", "Send", "Wallet" );

        setMsg("Payment sent!", true);


        $("#sendBtn").removeAttr("disabled");
        $("#sendBtn").html("Send");

        this.txSec = "";

        $("#password").val("");

        $("#txtAmount").val("").css({"font-size":"14px"});
        $("#txtAddress").val("");
        $("#fiatPrice").show();

        $("#oneNameInfo").hide();


        this.getBalance();
        playBeep();

        rush.getBalanceBlock = true;

        setTimeout( function ()
        {
            rush.getBalanceBlock = false;
        }, 1000);

    },
    "exportWallet": function ()
    {

        if (!this.encrypted)
        {
            setMsg("" + rush.passcode);
        }
        else
        {
            if ($("#password").val() == "")
            {
                setMsg("Please enter password to decrypt wallet.");
                return;
            }

            var passcode = CryptoJS.AES.decrypt(this.passcode, $("#password").val());

            var passcode = passcode.toString(CryptoJS.enc.Utf8);

            if (!passcode)
            {
                setMsg("Incorrenct Password!");
                return;
            }

            setMsg("Brainwallet: " + passcode);

            $("#password").val("");

        }

    },
    "importWallet": function ()
    {
        setMsg("Importing a brain wallet will replace your current wallet. You will lose your balance if you haven't backed it up!<br/><input type='text' id='importBrainTxt' placeholder='Brainwallet'> <button id='confirmImport'>Import</button>");
    },
    "confirmImport": function ()
    {

        if (!$("#confirmImport").attr("confirmed"))
        {
            $("#confirmImport").html("Are you sure? Click to confirm!").attr("confirmed", "true");
            $("<button id='clearBox'>No</button>").insertAfter("#confirmImport");
            return;
        }

        rush.passcode = $("#importBrainTxt").val();

        var bytes = Bitcoin.Crypto.SHA256(rush.passcode,
        {
            asBytes: true
        });

        var btcKey = new Bitcoin.Key(bytes);
        var address = btcKey.getBitcoinAddress().toString();

        rush.address = address;

        $("#password").hide();
        $("#preparePassword").show();
        this.encrypted = false;
        this.txSec = "";

        chrome.storage.local.set(
        {
            'code': rush.passcode,
            'encrypted': false,
            'address': address
        }, function ()
        {
            rush.open();

        });

        setMsg("Brainwallet imported succesfully!");



    }
    
   


};

function popup(txt)
{
    setGPGMsg('<textarea id="gpgBox" readonly></textarea>');

    $("#gpgBox").val(txt);
}

function popupMsg(txt)
{
    // txt = txt.replace(/\n/g, '<br />');
    setGPGMsg('<div id="messageBox">' + txt + '</div>');
}


$(document).ready(function ()
{

    var code = window.location.hash;

});

Date.prototype.format = function (format) //author: meizz
{
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "H+": this.getHours(), //hour
        "h+": ((this.getHours() % 12)==0)?"12":(this.getHours() % 12), //hour
        "z+": ( this.getHours()>11 )?"pm":"am", //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        "S": this.getMilliseconds() //millisecond
    }

    if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format))
            format = format.replace(RegExp.$1,
                RegExp.$1.length == 1 ? o[k] :
                ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}

function formatMoney(x)
{
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function htmlEncode(value)
{
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}

function s2hex(s)
{
    return Bitcoin.convert.bytesToHex(Bitcoin.convert.stringToBytes(s))
}

function playBeep()
{
    var snd = document.getElementById('noise');
    snd.src = 'balance.wav';
    snd.load();
    snd.play();
}

function playBaron()
{
    var snd = document.getElementById('noise');
    rush.snd = snd;
    snd.src = 'baron.mp3';
    snd.load();
    snd.play();
}

function playTurn()
{
    var snd = document.getElementById('noise');
    rush.snd = snd;
    snd.src = 'turn.mp3';
    snd.load();
    snd.play();
}

function ajax(url,success,data) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            success(xhr.responseText);
            xhr.close;
        }
    }
    xhr.open(data ? "POST" : "GET", url, true);
    if (data) xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(data);
}

function tx_fetch(url, onSuccess, onError, postdata)
{
    $.ajax(
    {
        url: url,
        data: postdata || '',
        type: "POST",
        success: function (res)
        {
            onSuccess(JSON.stringify(res));

        },
        error: function (xhr, opt, err)
        {
            // console.log("error!");
        }
    });
}

function setMsg( msg, green )
{
    $("#errorBox").slideDown();
    $("#errorTxt").html( msg );

    if ( green )
    {
        $("#errorBox").addClass("green");
    }
    else
        $("#errorBox").removeClass("green");

    setTimeout( function ()
    {
        $("#errorBox").slideUp();
    }, 5000);

}
