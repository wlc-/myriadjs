/*
  tx.js - Bitcoin transactions for JavaScript (public domain)

  Obtaining inputs:
  1) http://blockchain.info/unspent?address=<address>
  2) http://blockexplorer.com/q/mytransactions/<address>

  Sending transactions:
  1) http://bitsend.rowit.co.uk
  2) http://www.blockchain.info/pushtx
*/

var TX = window.TX = new function () {

        var inputs = [];
        var outputs = [];
        var eckey = null;
        var balance = 0;

        this.init = function (_eckey)
        {
            outputs = [];
            eckey = _eckey;
        }

        this.addOutput = function (addr, fval)
        {
            outputs.push(
            {
                address: addr,
                value: fval
            });
        }

	    this.removeOutputs = function() {
	        outputs = [];
	    }

        this.getBalance = function ()
        {
            return balance;
        }

	    this.getFee = function(sendTx) {
	        var out = BigInteger.ZERO;
	        for (var i in outputs) {
	            var fval = outputs[i].value;
	            value = new BigInteger('' + Math.round(fval*1e8), 10);
	            out = out.add(value);
	        }
	        return balance.subtract(out);
	    }

        //this.getAddress = function ()
        //{
        //    return eckey.getBitcointAddress().toString();
        //}
    	this.getAddress = function(addrtype) {
			version = 0x32;
			addrtype = version;
	        var addr = new Bitcoint.Address(eckey.getPubKeyHash());
	        addr.version = addrtype ? addrtype : 0;
	        return addr.toString();
	    }

        this.parseInputs = function (text, address)
        {
            try
            {
                var res = tx_parseBCI(text, address);
            }
            catch (err)
            {
                var res = parseTxs(text, address);
            }
	    //console.log('tx.js, parseInputs, res: ');
	    //console.log(res);

            balance = res.balance;
            inputs = res.unspenttxs;
        }

        //this.construct = function ()
        //{
    	//this.rebuild = function(sendTx, resign) {
    	this.rebuild = function(privkey, sendTx, resign) {
			//console.log('privkey: ');
			//console.log(privkey);
			var keyPair = Bitcoint.ECPair.fromWIF(privkey);
			//console.log(keyPair);
        	if (!resign)
          		//sendTx = new Bitcoint.Transaction();
          		sendTx = new Bitcoint.TransactionBuilder();
            
			var selectedOuts = [];
			console.log('inputs:');
			console.log(inputs);
            for (var hash in inputs)
            {
                if (!inputs.hasOwnProperty(hash))
                    continue;
                for (var index in inputs[hash])
                {
                    if (!inputs[hash].hasOwnProperty(index))
                        continue;
                    var script = parseScriptT(inputs[hash][index].script);
                	var b64hash = Crypto.util.bytesToBase64(Crypto.util.hexToBytes(hash));
                	var txin = new Bitcoint.TransactionIn({outpoint: {hash: b64hash, index: index}, script: script, sequence: 4294967295});
                    selectedOuts.push(txin);
                	if (!resign)
                  		sendTx.addInput(txin);
                }
            }

            for (var i in outputs)
            {
                var address = outputs[i].address;
                var fval = outputs[i].value;
            	var value = new BigInteger('' + Math.round(fval * 1e8), 10);
				console.log('output address:');
				console.log(address);
				console.log('value:');
				console.log(value[0]);
            	if (!resign) {
              		//sendTx.addOutput(new Bitcoint.Address(address), value);
              		sendTx.addOutput(address, value[0]);
				}
            }

        	var hashType = 1;
			console.log('sendTx:');
			console.log(sendTx);
	        //for (var i = 0; i < sendTx.ins.length; i++) {
	        //    var connectedScript = selectedOuts[i].script;
	        //    var hash = sendTx.hashTransactionForSignature(connectedScript, i, hashType);
	        //    var pubKeyHash = connectedScript.simpleOutPubKeyHash();
	        //    var signature = eckey.sign(hash);
	        //    signature.push(parseInt(hashType, 10));
	        //    var pubKey = eckey.getPub();
	        //    var script = new Bitcoint.Script();
	        //    script.writeBytes(signature);
	        //    script.writeBytes(pubKey);
	        //    sendTx.ins[i].script = script;
	        //}
            return sendTx;
        };


		//this.construct = function() {
		//	return this.rebuild(null, false);
		//}
		this.construct = function(privkey) {
			return this.rebuild(privkey, null, false);
		}

		this.resign = function(sendTx) {
			return this.rebuild(sendTx, true);
		}

        function uint(f, size)
        {
            if (f.length < size)
                return 0;
            var bytes = f.slice(0, size);
            var pos = 1;
            var n = 0;
            for (var i = 0; i < size; i++)
            {
                var b = f.shift();
                n += b * pos;
                pos *= 256;
            }
            return size <= 4 ? n : bytes;
        }

        function u8(f)
        {
            return uint(f, 1);
        }

        function u16(f)
        {
            return uint(f, 2);
        }

        function u32(f)
        {
            return uint(f, 4);
        }

        function u64(f)
        {
            return uint(f, 8);
        }

        function errv(val)
        {
            return (val instanceof BigInteger || val > 0xffff);
        }

        function readBuffer(f, size)
        {
            var res = f.slice(0, size);
            for (var i = 0; i < size; i++) f.shift();
            return res;
        }

        function readString(f)
        {
            var len = readVarInt(f);
            if (errv(len)) return [];
            return readBuffer(f, len);
        }

        function readVarInt(f)
        {
            var t = u8(f);
            if (t == 0xfd) return u16(f);
            else
            if (t == 0xfe) return u32(f);
            else
            if (t == 0xff) return u64(f);
            else
                return t;
        }

    //    this.deserialize = Bitcoint.Transaction.deserialize;
    this.deserialize = function(bytes) {
        var sendTx = new Bitcoint.Transaction();

        var f = bytes.slice(0);
        var tx_ver = u32(f);
        var vin_sz = readVarInt(f);
        if (errv(vin_sz))
            return null;

        for (var i = 0; i < vin_sz; i++) {
            var op = readBuffer(f, 32);
            var n = u32(f);
            var script = readString(f);
            var seq = u32(f);
            var txin = new Bitcoint.TransactionIn({
                outpoint: { 
                    hash: Crypto.util.bytesToBase64(op),
                    index: n
                },
                script: new Bitcoint.Script(script),
                sequence: seq
            });
            sendTx.addInput(txin);
        }

        var vout_sz = readVarInt(f);

        if (errv(vout_sz))
            return null;

        for (var i = 0; i < vout_sz; i++) {
            var value = u64(f);
            var script = readString(f);

            var txout = new Bitcoint.TransactionOut({
                value: value,
                script: new Bitcoint.Script(script)
            });

            sendTx.addOutput(txout);
        }
        var lock_time = u32(f);
        sendTx.lock_time = lock_time;
        return sendTx;
    };

        this.toBBE = function (sendTx)
        {
            //serialize to Bitcoin Block Explorer format
            var buf = sendTx.serialize();
            var hash = Crypto.SHA256(Crypto.SHA256(buf,
            {
                asBytes: true
            }),
            {
                asBytes: true
            });

            var r = {};
            r['hash'] = Crypto.util.bytesToHex(hash.reverse());
            r['ver'] = sendTx.version;
            r['vin_sz'] = sendTx.ins.length;
            r['vout_sz'] = sendTx.outs.length;
            r['lock_time'] = sendTx.lock_time;
            r['size'] = buf.length;
            r['in'] = []
            r['out'] = []

            for (var i = 0; i < sendTx.ins.length; i++)
            {
                var txin = sendTx.ins[i];
            	var hash = Crypto.util.base64ToBytes(txin.outpoint.hash);
                var n = txin.outpoint.index;
            	var prev_out = {'hash': Crypto.util.bytesToHex(hash.reverse()), 'n': n};
            	var seq = txin.sequence;
            	if (n == 4294967295) {
                	var cb = Crypto.util.bytesToHex(txin.script.buffer);
                	r['in'].push({'prev_out': prev_out, 'coinbase' : cb, 'sequence':seq});
            	} else {
                	var ss = dumpScript(txin.script);
                	r['in'].push({'prev_out': prev_out, 'scriptSig' : ss, 'sequence':seq});
            	}
            }

            for (var i = 0; i < sendTx.outs.length; i++)
            {
            	var txout = sendTx.outs[i];
            	var bytes = txout.value.slice(0);
            	var fval = parseFloat(Bitcoint.Util.formatValue(bytes.reverse()));
            	var value = fval.toFixed(8);
            	var spk = dumpScript(txout.script);
            	r['out'].push({'value' : value, 'scriptPubKey': spk});
            }

            return JSON.stringify(r, null, 4);
        };

        this.fromBBE = function (text)
        {
            //deserialize from Bitcoint Block Explorer format
            var sendTx = new Bitcoint.Transaction();
            var r = JSON.parse(text);
            if (!r)
                return sendTx;
            var tx_ver = r['ver'];
            var vin_sz = r['vin_sz'];

            for (var i = 0; i < vin_sz; i++)
            {
                var txi = r['in'][i];
                var hash = Bitcoint.convert.hexToBytes(txi['prev_out']['hash']);
                var n = txi['prev_out']['n'];

                if (txi['coinbase'])
                    var script = Bitcoint.convert.hexToBytes(txi['coinbase']);
                else
                    var script = parseScriptT(txi['scriptSig']);

                var txin = new Bitcoint.TransactionIn(
                {
                    outpoint:
                    {
                        hash: Bitcoint.convert.bytesToHex(hash.reverse()),
                        index: n
                    },
                    script: new Bitcoint.Script(script),
                    sequence: 4294967295
                });
                sendTx.addInput(txin);
            }

            var vout_sz = r['vout_sz'];

            for (var i = 0; i < vout_sz; i++)
            {
                var txo = r['out'][i];
                var fval = parseFloat(txo['value']);
                var value = new BigInteger('' + Math.round(fval * 1e8), 10);
                var script = parseScriptT(txo['scriptPubKey']);

                if (value instanceof BigInteger)
                {
                    value = value.toByteArrayUnsigned().reverse();
                    while (value.length < 8) value.push(0);
                }

                var txout = new Bitcoint.TransactionOut(
                {
                    value: value,
                    script: new Bitcoint.Script(script)
                });

                sendTx.addOutput(txout);
            }
            sendTx.lock_time = r['lock_time'];
            return sendTx;
        };
        return this;
    };

function dumpScript(script)
{
    var out = [];
    for (var i = 0; i < script.chunks.length; i++)
    {
        var chunk = script.chunks[i];
        var op = new Bitcoint.Opcode(chunk);
        typeof chunk == 'number' ? out.push(op.toString()) :
            out.push(Crypto.util.bytesToHex(chunk));
    }
    return out.join(' ');
}

// blockr.io parser 
// uses http://btc.blockr.io/api/v1/address/unspent/<address>
function tx_parseBlockr(data, address)
{
    var r = JSON.parse(data);
    var txs = r.data.unspent;

    if (!txs)
        throw 'Not a BCI format';

    delete unspenttxs;
    var unspenttxs = {};
    var balance = BigInteger.ZERO;
    for (var i in txs)
    {
        var o = txs[i];
		tmp = Bitcoint.convert.hexToBytes(o.tx);
		tmp = Bitcoint.convert.bytesToHex(tmp.reverse());
		var lilendHash = tmp;

        //convert script back to BBE-compatible text
        var script = dumpScript(new Bitcoint.Script(Bitcoint.convert.hexToBytes(o.script)));

        var value = new BigInteger('' + ( o.amount * 100000000 ), 10);
        if (!(lilendHash in unspenttxs))
            unspenttxs[lilendHash] = {};
        unspenttxs[lilendHash][o.n] = {
            amount: ( value ),
            script: script
        };
        balance = balance.add(value);
    }
    return {
        balance: balance,
        unspenttxs: unspenttxs
    };
}

// blockchain.info parser (adapted)
// uses http://blockchain.info/unspent?address=<address>
function tx_parseBCI(data, address)
{
    var r = JSON.parse(data);
    var txs = r.unspent_outputs;
    //console.log('tx.js, tx_parseBCI, r: ');
    //console.log(r);

    if (!txs)
        throw 'Not a BCI format';

    delete unspenttxs;
    var unspenttxs = {};
    //var balance = BigInteger.ZERO;
    var balance = 0;
    for (var i in txs)
    {
        var o = txs[i];
		tmp = Crypto.util.hexToBytes(o.tx_hash);
		tmp = Crypto.util.bytesToHex(tmp.reverse());
		
		var lilendHash = tmp;

        //convert script back to BBE-compatible text
        var script = dumpScript(new Bitcoint.Script(Crypto.util.hexToBytes(o.script)));

        //var value = new BigInteger('' + o.value, 10);
        var value = o.value;
        if (!(lilendHash in unspenttxs))
            unspenttxs[lilendHash] = {};
        unspenttxs[lilendHash][o.tx_output_n] = {
            amount: value,
            script: script
        };
        //balance = balance.add(value);
        balance = balance + value;
    	//console.log('tx.js, tx_parseBCI, for loop, value: '+value);
    	//console.log(value);
    	//console.log('tx.js, tx_parseBCI, for loop, balance: '+balance);
    	//console.log(balance);
    }
    //console.log('tx.js, tx_parseBCI, balance: ');
    //console.log(balance);
    return {
        balance: balance,
        unspenttxs: unspenttxs
    };
}

function parseTxs(data, address)
{

    var address = address.toString();
    var tmp = JSON.parse(data);
    var txs = [];
    for (var a in tmp)
    {
        if (!tmp.hasOwnProperty(a))
            continue;
        txs.push(tmp[a]);
    }

    // Sort chronologically
    txs.sort(function (a, b)
    {
        if (a.time > b.time) return 1;
        else if (a.time < b.time) return -1;
        return 0;
    })

    delete unspenttxs;
    var unspenttxs = {}; // { "<hash>": { <output index>: { amount:<amount>, script:<script> }}}

    var balance = BigInteger.ZERO;

    // Enumerate the transactions 
    for (var a in txs)
    {

        if (!txs.hasOwnProperty(a))
            continue;
        var tx = txs[a];
        //if (tx.ver != 1) throw "Unknown version found. Expected version 1, found version " + tx.ver;

        // Enumerate inputs
        for (var b in tx. in )
        {
            if (!tx. in .hasOwnProperty(b))
                continue;
            var input = tx. in [b];
            var p = input.prev_out;
            var lilendHash = endian(p.hash)
            // if this came from a transaction to our address...
            if (lilendHash in unspenttxs)
            {
                unspenttx = unspenttxs[lilendHash];

                // remove from unspent transactions, and deduce the amount from the balance
                balance = balance.subtract(unspenttx[p.n].amount);
                delete unspenttx[p.n]
                if (isEmpty(unspenttx))
                {
                    delete unspenttxs[lilendHash]
                }
            }
        }

        // Enumerate outputs
        var i = 0;
        for (var b in tx.out)
        {
            if (!tx.out.hasOwnProperty(b))
                continue;

            var output = tx.out[b];

            // if this was sent to our address...
            if (output.address == address)
            {
                // remember the transaction, index, amount, and script, and add the amount to the wallet balance
                var value = btcstr2bignum(output.value);
                var lilendHash = endian(tx.hash)
                if (!(lilendHash in unspenttxs))
                    unspenttxs[lilendHash] = {};
                unspenttxs[lilendHash][i] = {
                    amount: value,
                    script: output.scriptPubKey
                };
                balance = balance.add(value);
	//console.log('Updated balance: '+balance);
            }
            i = i + 1;
        }
    }

    return {
        balance: balance,
        unspenttxs: unspenttxs
    };
}

function isEmpty(ob) {
    for(var i in ob){ if(ob.hasOwnProperty(i)){return false;}}
    return true;
}

function endian(string) {
    var out = []
    for(var i = string.length; i > 0; i-=2) {
        out.push(string.substring(i-2,i));
    }
    return out.join("");
}

function btcstr2bignum(btc) {
    var i = btc.indexOf('.');
    var value = new BigInteger(btc.replace(/\./,''));
    var diff = 9 - (btc.length - i);
    if (i == -1) {
        var mul = "100000000";
    } else if (diff < 0) {
        return value.divide(new BigInteger(Math.pow(10,-1*diff).toString()));
    } else {
        var mul = Math.pow(10,diff).toString();
    }
    return value.multiply(new BigInteger(mul));
}

function parseScriptT(script) {
    var newScript = new Bitcoint.Script();
    var s = script.split(" ");
    for (var i in s) {
        if (Bitcoint.Opcode.map.hasOwnProperty(s[i])){
            newScript.writeOp(Bitcoint.Opcode.map[s[i]]);
        } else {
            newScript.writeBytes(Crypto.util.hexToBytes(s[i]));
        }
    }
    return newScript;
}
