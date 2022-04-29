import { MAXSENSORS } from './RobotSimulator.js';

class RobotShape extends THREE.Group{
    constructor(width, length, numSens, sensSpace){
        super();
        this.robotWidth  = width;
        this.robotLength = length;
        this.NumberOfSensors = numSens;
        this.SensorSpacing = sensSpace;
        this.LEDColour = "red";
        this.isLoaded = false;
        this.sizeOK = true;
        //this.visible = false;
        this.checkSize();


        // Make wheel from primitives...
        const wheelRim = new THREE.Shape();
        wheelRim.absellipse(0,0,20,20,0,Math.PI);
        wheelRim.absellipse(0,0,20,20,Math.PI,2*Math.PI);   
        const innerRim = new THREE.Path();
        innerRim.absellipse(0,0,15,15);
        wheelRim.holes = [innerRim];
        const extrudeSettings = { depth: 6,	bevelEnabled: true,
            bevelThickness: 1, bevelSize: 1, bevelOffset: 0, bevelSegments: 1};
        const hub = new THREE.CylinderGeometry(3,3,4,12);
        hub.rotateX(Math.PI/2);
        const gArray = [new THREE.ExtrudeGeometry(wheelRim, extrudeSettings),
                    hub.toNonIndexed()];
        gArray[0].translate(0,0,-3);
        let spokes = [];
        for(let n = 0; n < 5; n++){
            spokes.push(new THREE.CylinderGeometry(1.5,1.5,15,8));
            spokes[n].translate(0,8,0);
            spokes[n].rotateZ(n*Math.PI*0.4);
            spokes[n] = spokes[n].toNonIndexed();
        }
        var geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(gArray.concat(spokes));
        this.setWheelColour(0x444444);
        this.Rw = new THREE.Mesh(geometry, this.wheelMat);
        this.Rw.rotateX(-Math.PI/2);
        this.Lw = this.Rw.clone();
        this.Rw.position.set(0,this.robotWidth/2,-20);
        this.Lw.position.set(0,-this.robotWidth/2,-20);
        this.Rw.castShadow=true;
        this.Lw.castShadow=true;

        // body1 - box between the wheels
        //this.bodyMat = new THREE.MeshPhongMaterial({color: 0x2070D0, specular: 0x505050, shininess: 10, shading: THREE.SmoothShading  });
        this.setBodyColour(0x2070D0);
        /*var body1g = new THREE.BoxGeometry(40, this.robotWidth-10, 20);
        this.body1 = new THREE.Mesh(body1g, this.bodyMat);
        this.body1.position.set(0, 0, -20);
        this.body1.castShadow = true;*/
        // body2 - wedge connecting wheels to sensor bar

        //body2g.computeFaceNormals();
        this.body2 = new THREE.Mesh(this.makeBodyGeometry(), this.bodyMat);
        this.body2.castShadow = true;
        // body3 - sensor bar
        var body3g = new THREE.BoxGeometry(14, 14 + this.SensorSpacing*(this.NumberOfSensors-1), 3);
        this.body3 = new THREE.Mesh(body3g, this.bodyMat);
        this.body3.position.set(this.robotLength, 0, -10);
        this.body3.castShadow = true;
        // body4/5 - caster
        this.body4 = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 8,  0, 2*Math.PI, 0, Math.PI/2), 
            new THREE.MeshPhongMaterial({color: 0xd0d0d0, specular: 0x505050, shininess: 100 }));
        this.body4.rotateX(Math.PI/2);
        this.body4.position.set(this.robotLength - 20, 0, -5);
        this.body5 = new THREE.Mesh(new THREE.CylinderGeometry(5.5,5.5,5.5,12),
            new THREE.MeshPhongMaterial({color: 0x000000, specular: 0x505050, shininess: 100  }));
        this.body5.rotateX(-Math.PI/2);
        this.body5.position.set(this.robotLength - 20, 0, -7.5);

        //this.add(this.body1);
        this.add(this.body2);
        this.add(this.body3);
        this.add(this.body4);
        this.add(this.body5);
        this.add(this.Lw);    
        this.add(this.Rw);    
        
        this.sensors = [];
        this.sensorBoxes = [];
        var sensorLEDg = new THREE.SphereGeometry(4, 12, 8, 0, 2*Math.PI, 0, Math.PI/2);
        this.setLEDColour('red');
        var sensorLEDMesh = new THREE.Mesh(sensorLEDg, this.sensorLEDMat);
        sensorLEDMesh.rotateX(-Math.PI/2);
        var sensorBoxg = new THREE.BoxGeometry(8, 5, 5);
        var sensorBoxMat =  new THREE.MeshPhongMaterial({color: 0x000000, specular: 0x505050, shininess: 100 });
        var sensorBoxMesh = new THREE.Mesh(sensorBoxg, sensorBoxMat);
        for(var n = 0; n < MAXSENSORS; n++){
            var sensorN = sensorLEDMesh.clone();
            sensorN.position.set(this.robotLength, (n - (this.NumberOfSensors-1.0)/2.0)*this.SensorSpacing, -11.5);
            this.sensors.push(sensorN);
            var sensorBoxN = sensorBoxMesh.clone();
            sensorBoxN.position.set(this.robotLength, (n - (this.NumberOfSensors-1.0)/2.0)*this.SensorSpacing, -7);
            this.sensorBoxes.push(sensorBoxN);
            this.sensors[n].visible = (n < this.NumberOfSensors);
            this.sensorBoxes[n].visible = (n < this.NumberOfSensors);
            this.add(this.sensors[n]);
            this.add(this.sensorBoxes[n]);                
        }
        this.isLoaded = true;  
    }

    makeBodyGeometry(){
        var body2g = new THREE.BufferGeometry();
        body2g.setAttribute('position', new THREE.BufferAttribute( new Float32Array([
            20, this.robotWidth/2-5, -10, //0
            20, this.robotWidth/2-5, -30, //1
            this.robotLength, 5, -10,   //2
            this.robotLength, -5, -10,  //3
            20, -this.robotWidth/2+5, -30,  //4
            20, -this.robotWidth/2+5, -10,  //5
            -20, this.robotWidth/2-5, -30,  //6
            -20, -this.robotWidth/2+5, -30,   //7
            -20, this.robotWidth/2-5, -10,  //8
            -20, -this.robotWidth/2+5, -10   //9
        ]), 3 ) );
        body2g.setIndex([0,2,1, 3,1,2, 3,4,1, 3,5,4, 0,5,3, 0,3,2, 1,7,6, 4,7,1, 7,4,9, 5,9,4,
            6,8,1, 0,1,8, 6,7,8, 7,9,8]);
        body2g.computeVertexNormals();
        return body2g;
    }

    setBodyColour(c){
        //this.bodyMat = new THREE.MeshPhongMaterial({color: c, specular: 0x505050, shininess: 50});// 10, flatShading: true  });
        this.bodyMat = new THREE.MeshPhysicalMaterial({color: c, roughness: 0.35, metalness: 0.1, reflectivity: 0.15});
        if(this.isLoaded){
            //this.body1.material = this.bodyMat;
            this.body2.material = this.bodyMat;
            this.body3.material = this.bodyMat;
        }
    }
    setWheelColour(c){
        this.wheelMat = new THREE.MeshLambertMaterial({reflectivity: 1, color: c});
        this.wheelMat.flatShading = false;
        if(this.isLoaded){
            this.Rw.material = this.wheelMat;
            this.Lw.material = this.wheelMat;
        }
    }
    
    setLEDColour(c){
        this.LEDColour = c;
        switch(c){
            case "red":
                this.sensorLEDMat =  new THREE.MeshPhongMaterial({color: 0x600000, specular: 0x505050, shininess: 100  });
                this.sensorLEDMatOn =  new THREE.MeshPhongMaterial({color: 0x600000, emissive: 0xFF0000, specular: 0x505050, shininess: 100  });
                break;
            case "yellow":
                this.sensorLEDMat =  new THREE.MeshPhongMaterial({color: 0x604000, specular: 0x505050, shininess: 100  });
                this.sensorLEDMatOn =  new THREE.MeshPhongMaterial({color: 0x604000, emissive: 0xA0A000, specular: 0x505050, shininess: 100  });
                break;
            case "green":
                this.sensorLEDMat =  new THREE.MeshPhongMaterial({color: 0x004000, specular: 0x505050, shininess: 100  });
                this.sensorLEDMatOn =  new THREE.MeshPhongMaterial({color: 0x004000, emissive: 0x00A000, specular: 0x505050, shininess: 100  });
                break;
            case "blue":
                this.sensorLEDMat =  new THREE.MeshPhongMaterial({color: 0x000070, specular: 0x505050, shininess: 100  });
                this.sensorLEDMatOn =  new THREE.MeshPhongMaterial({color: 0x00070, emissive: 0x0060FF, specular: 0x505050, shininess: 100  });
                break;
            default:
                this.sensorLEDMat =  new THREE.MeshPhongMaterial({color: 0x000000, specular: 0x505050, shininess: 100  });
                this.sensorLEDMatOn =  new THREE.MeshPhongMaterial({color: 0x000000, emissive: 0x000000, specular: 0x505050, shininess: 100  });
                break;
        }
        this.refreshLEDs();
    }
    refreshLEDs(){
        if(this.isLoaded){
            for(var m = 0; m < MAXSENSORS; m++) {
                this.sensors[m].material =  this.sensorLEDMat; 
            }
        }
    }

    setSize(params){
        if (this.isLoaded){        
            this.robotWidth = params.width;
            this.robotLength = params.length;
            this.NumberOfSensors = params.NumberOfSensors;
            this.SensorSpacing = params.SensorSpacing;
            this.checkSize();     
            /*this.body1.geometry.dispose();       
            this.body1.geometry = new THREE.BoxGeometry(40, this.robotWidth-10, 20);*/
            this.body2.geometry.dispose();
            this.body2.geometry = this.makeBodyGeometry();       
            this.Rw.position.set(0,this.robotWidth/2,-20);
            this.Lw.position.set(0,-this.robotWidth/2,-20);                 
            this.body3.geometry.dispose();
            this.body3.geometry = new THREE.BoxGeometry(14, 14 + this.SensorSpacing*(this.NumberOfSensors-1), 3);
            this.body3.position.set(this.robotLength, 0, -10);
            this.body4.position.set(this.robotLength - 20, 0, -5);
            this.body5.position.set(this.robotLength - 20, 0, -7.5);
            for(var n = 0; n < MAXSENSORS; n++){
                this.sensors[n].position.set(this.robotLength, (n - (this.NumberOfSensors-1.0)/2.0)*this.SensorSpacing, -11.5);
                this.sensors[n].visible = (n < this.NumberOfSensors);
                this.sensorBoxes[n].position.set(this.robotLength, (n - (this.NumberOfSensors-1.0)/2.0)*this.SensorSpacing, -7);
                this.sensorBoxes[n].visible = (n < this.NumberOfSensors);
            }            
        }
    }

    checkSize(){
        let p0 = new THREE.Vector2(7 + this.robotLength, 7 + this.SensorSpacing*(this.NumberOfSensors-1)/2); // Front Edge of sensors
        let p3 = new THREE.Vector2(-7 + this.robotLength, 7 + this.SensorSpacing*(this.NumberOfSensors-1)/2); // Back Edge of sensors
        let p1 = new THREE.Vector2(-20, this.robotWidth/2 + 4);                                              // Back of wheel
        let p2 = new THREE.Vector2(20, this.robotWidth/2 + 4);                                               // Front of wheel
        this.xOffset = (p1.lengthSq() - p0.lengthSq()) / 2 / (p1.x - p0.x);
        let org = new THREE.Vector2(this.xOffset, 0);
        this.radius = p0.distanceTo(org);
        if(p1.y > p0.y){ // wheels stick out further than sensor bar
            if(p2.distanceTo(org) > this.radius){
                this.xOffset = 0;
                this.radius = p1.length();
            }
        } else {
            if(p3.distanceTo(org) > this.radius){
                this.xOffset = this.robotLength;
                org.x = this.xOffset;
                this.radius = p0.distanceTo(org);
            }
        }
        //this.sizeOK = (this.radius <= 130);
        this.sizeOK = (this.robotWidth <= 132 && this.robotLength <= 193 && this.SensorSpacing*(this.NumberOfSensors-1) < 126);
    }
}

export { RobotShape }; 