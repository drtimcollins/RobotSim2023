class Stats{
	constructor(){
		this.beginTime = ( performance || Date ).now();
		this.prevTime = this.beginTime;
		this.frames = 0;
		this.fps = 0;
    }
	update(){
		this.frames++;
		var time = ( performance || Date ).now();
		if ( time >= this.prevTime + 1000 ) {
			this.fps =  ( this.frames * 1000 ) / ( time - this.prevTime );
			this.prevTime = time;
			this.frames = 0;
			console.log(this.fps);
		}		
	}
}

export {Stats};