import { MAXSENSORS } from './RobotSimulator.js';

class RobotCompiler{
	constructor(){
        this.isInit = false;
    }    
	init(par){
		// Find track Bounds
        let minmax = [par.bbox.min.x, par.bbox.min.y, par.bbox.max.x, par.bbox.max.y];
//		let minmax = [par.track[0].x,par.track[0].y,par.track[0].x,par.track[0].y]; // [minx,miny,maxx,maxy]
        let startIndex = 0;
        let bestD2 = par.track[0].distanceToSquared(par.start);
//        let bestD2 = (par.track[0].x - par.start.x)*(par.track[0].x - par.start.x) + (par.track[0].y - par.start.y)*(par.track[0].y - par.start.y);
		par.track.forEach(p => {
/*			if(p.x < minmax[0]) minmax[0] = p.x;
			if(p.y < minmax[1]) minmax[1] = p.y;
			if(p.x > minmax[2]) minmax[2] = p.x;
			if(p.y > minmax[3]) minmax[3] = p.y;*/
            let d2 = p.distanceToSquared(par.start);
//            let d2 = (p.x - par.start.x)*(p.x - par.start.x) + (p.y - par.start.y)*(p.y - par.start.y);
            if(d2 < bestD2){
                startIndex = par.track.indexOf(p);
                bestD2 = d2;
            }
		});
		this.track = par.track;
		this.trackBounds = [new THREE.Vector2(minmax[0],minmax[1]), new THREE.Vector2(minmax[2],minmax[3])];
		console.log(this.trackBounds);
		this.bot = par.robot;	
        this.start = par.start;
        this.startIndex = startIndex;

        // Input format:
        // minmax0 mm1 mm2 mm3 NtrackPoints trackpoint_n_x trackpoint_n_y etc
        this.inString = minmax[0].toFixed(1) + " " + minmax[1].toFixed(1) + " " + minmax[2].toFixed(1) + " " + minmax[3].toFixed(1) + " " + par.track.length.toString();
        par.track.forEach(p =>{
            this.inString = this.inString + " " + p.x.toFixed(1) + " " + p.y.toFixed(1);
        })
		this.isInit = true;
    }
    
    updateParams(params){
        this.bot = params;      
    }

    exe(fn, callback){
        var cpp = this;
         $.get("scripts/RobotSrc.cpp", function (data){
            data = data.replace("#define DEFINES",
                "#define width " + cpp.bot.width.toString() 
                + "\n#define rlength " + cpp.bot.length.toString()
                + "\n#define NumberOfSensors " + cpp.bot.NumberOfSensors.toString()
                + "\n#define SensorSpacing " + cpp.bot.SensorSpacing.toString()
                + "\n#define WheelRadius " + cpp.bot.WheelRadius.toString()
                + "\n#define XSTART " + (cpp.start.x-cpp.bot.length).toString()
                + "\n#define YSTART " + (cpp.start.y).toString()
                + "\n#define ISTART " + (cpp.startIndex).toString());
            console.log("#define XSTART " + (cpp.start.x-cpp.bot.length).toString()
            + "\n#define YSTART " + (cpp.start.y).toString()
            + "\n#define ISTART " + (cpp.startIndex).toString());
            data = data.replace("#define ROBOTCONTROLFUNCTION", fn);
            // let to_compile = JSON.stringify({
            //     compiler: 'clang-head',
            //     //compiler: 'gcc-head',
            //     code: data,
            //     stdin: cpp.inString,
            //     'compiler-option-raw': "-fno-color-diagnostics"
            // });


//             var http = new XMLHttpRequest();
//             http.open("POST", "http://coliru.stacked-crooked.com/compile", false);
//             http.send(JSON.stringify({ "cmd": "g++ -std=c++20 -O2 -Wall -pedantic -pthread main.cpp && ./a.out << EOF\n"+cpp.inString+"\nEOF",
// //                "src": '#include<iostream>\n int main() { float x; for(int n = 0; n < 1205; n++){std::cin >> x; if(n > 1195) std::cout << x << std::endl;} }' }));
//                   "src": data }));
//             alert(http.response);

//            let to_compile = JSON.stringify({"cmd": "g++ -std=c++20 -O2 -Wall -pedantic -pthread main.cpp && ./a.out << EOF\n"+cpp.inString+"\nEOF",
            let to_compile = JSON.stringify({"cmd": "g++ -std=c++20 -O2 -pthread main.cpp && ./a.out << EOF\n"+cpp.inString+"\nEOF",
                                             "src": data });
            // $.ajax({
            //     url: "http://coliru.stacked-crooked.com/compile",
            //     type: "POST",
            //     data: to_compile
            // }).done(function(data){
            //     console.log(data);
            // });            

            var http = new XMLHttpRequest();
            http.open("POST", "https://coliru.stacked-crooked.com/compile", false);
            http.onload = function(onLoadarg){                
                let dataJ = http.response.split('\n');
                let dataString = "";
                let errString = "";
                let infString = "";
                if(dataJ[0] == "###OK###"){
                    dataJ.forEach(x => {
                        if(x != "###OK###")
                            dataString += decodeHex(x, cpp.bot.NumberOfSensors);
                    });
                } else {
                    errString = http.response;
                }
                // dataJ.forEach(x => {
                //     if(x != null){
                //         if(x.type == 'StdOut') dataString += decodeHex(x.data, cpp.bot.NumberOfSensors);
                //         if(x.type == 'CompilerMessageE' || x.type == 'StdErr' || x.type == 'Signal') errString += x.data;
                //         if(x.type == 'CompilerMessageS') infString += x.data;
                //     }
                // });
                callback({Errors: (errString.length > 0)?errString:null, Result: dataString, Stats: infString});
            };
            http.send(to_compile);


/*           $.ajax ({
                url: "https://wandbox.org/api/compile.ndjson",
                type: "POST",
                data: to_compile
            }).done(function(data) {
                let dataJ = data.split('\n').map(s => (s.length > 0)?JSON.parse(s):null);
                let dataString = "";
                let errString = "";
                let infString = "";
                dataJ.forEach(x => {
                    if(x != null){
                        if(x.type == 'StdOut') dataString += decodeHex(x.data, cpp.bot.NumberOfSensors);
                        if(x.type == 'CompilerMessageE' || x.type == 'StdErr' || x.type == 'Signal') errString += x.data;
                        if(x.type == 'CompilerMessageS') infString += x.data;
                    }
                });
                //console.log("Compiler response:\n" + dataString);

//                console.log("Compiler response:\n" + data.compiler_message + "\n" + data.signal);
//                console.log("Size of data returned = " + JSON.stringify(data).length);
//                callback({Errors: (data.compiler_error==null)?data.program_error:data.compiler_error,  // Need to check for program_error too...
//                    Result: data.program_output,
//                    Stats: data.compiler_message});
                callback({Errors: (errString.length > 0)?errString:null, Result: dataString, Stats: infString});
            }).fail(function(data, err) {
                console.log("fail " + JSON.stringify(data) + " " + JSON.stringify(err));
            });*/
        });
    }

    exe_Old_Rextester(fn, callback){
        var cpp = this;
         $.get("scripts/RobotSrc.cpp", function (data){
            data = data.replace("#define DEFINES",
                "#define width " + cpp.bot.width.toString() 
                + "\n#define length " + cpp.bot.length.toString()
                + "\n#define NumberOfSensors " + cpp.bot.NumberOfSensors.toString()
                + "\n#define SensorSpacing " + cpp.bot.SensorSpacing.toString()
                + "\n#define XSTART " + (cpp.start.x-cpp.bot.length).toString()
                + "\n#define YSTART " + (cpp.start.y).toString()
                + "\n#define ISTART " + (cpp.startIndex).toString());
            data = data.replace("#define ROBOTCONTROLFUNCTION", fn);
            var to_compile = {
                "LanguageChoice": "7",  // 6 = C, 7 = C++
                "Program": data,
                "Input": cpp.inString,
                "CompilerArgs" : "source_file.cpp -o a.out",
				"ApiKey": "55c9fc8c-442b-4f67-8000-d7b4a926e3f3"
            };
           $.ajax ({
                url: "https://rextester.com/rundotnet/api",
                type: "POST",
                data: to_compile
            }).done(function(data) {
                console.log("Success: " + data.Stats);
                callback(data);
            }).fail(function(data, err) {
                console.log("fail " + JSON.stringify(data) + " " + JSON.stringify(err));
            });
        });
    }
}

function decodeHex(x, nSensors){
    let z = "";
    let xx = x.split(/\r?\n/);
    xx.forEach(xn=>{
        if(xn.length > 0) z += deHex(xn, nSensors);
    });
    return z;
}
function deHex(x, nSensors){
    if(x.substr(0,1) == 'L') return x+"\n";
    else
    return (hex2int(x.substr(0,4))/16+640).toString() + " " +
            (hex2int(x.substr(4,4))/16+360).toString() + " " +
            (Math.cos(hex2int(x.substr(8,4))/10000)).toString() + " " +
            (Math.sin(hex2int(x.substr(8,4))/10000)).toString() + " " +
            (Math.cos(hex2int(x.substr(12,4))/10000)).toString() + " " +
            (Math.sin(hex2int(x.substr(12,4))/10000)).toString() + " " +
            (Math.cos(hex2int(x.substr(16,4))/10000)).toString() + " " +
            (Math.sin(hex2int(x.substr(16,4))/10000)).toString() + " " +
            senseDec(x.substr(20,3), nSensors) + "\n";
}
function hex2int(s){
    let x = parseInt(s, 16);
    return (x>32767) ? x - 65536 : x;
}
function senseDec(s, nSensors){
    let x = ("0000000000" + parseInt(s, 16).toString(2)).slice (-10);
    let z = x.substr(nSensors-1,1);
    for(let n = 1; n < nSensors; n++) z += " " + x.substr(nSensors-n-1,1)
    return z;
}


export {RobotCompiler};