window.onload = function(){
    window.slider_template = 
        "<span class='slider'> \
            <span class='preset'></span>\
            <span class='progress'>\
                <span class='indicator'>\
				</span>\
			</span>\
			<span class='value'> 0.75 </span>\
			<span class='slide'></span>\
			<span class='left arrow'>◀</span>\
			<span class='right arrow'>▶</span>\
		</span>";

    window.Slider = function(opt){
        var self = this;
        opt = opt || {};
        this.$el = $(slider_template);
        this.offsetX = 0;
        this.min = 0;
        this.initialmin = 0;
        this.hardmin = false;
        this.max = 1;
        this.initialmax = 1;
        this.hardmax = false;
        this.autoresize = true;
        this.linear = false;
        this.label = "";
        this.set_value = null;
        this.looping = false;

        this.decimals  = 3;
        this.precision = 0.01;
        this.precise = 0.1;
        this.maxprecision = 0.001;
        this.step = 0.05;
        this.minstep = 0.05;
        this.value = 0.75;
        this.increment = 0.1;
        

        this.showProgress = true;
        this.showIncrement = true;

        this.presets = {
            'min':this.min,
            'middle': (this.min+this.max)/2.0,
            'max':this.max,
        }
        this.sortedPresets = null;

        for(field in this){
            if(this.hasOwnProperty(field) && opt.hasOwnProperty(field)){
                this[field] = opt[field];
            }
        }
        this.$el.find('.left.arrow').click(function(){ self.decrease(); });
        this.$el.find('.right.arrow').click(function(){ self.increase(); });
        self.lastX = 0;
        this.$el.find('.slide').bind('dragstart',function(ev,drag){
            self.lastX = 0;
            self.startValue = self.value;
        });
        this.$el.find('.slide').bind('dragend',function(ev,drag){
            self.setBounds();
            self.$el.find('.preset').hide(250);
        });
        this.$el.find('.slide').bind('drag',function(ev,drag){ 
            var dx = drag.deltaX - self.lastX;
            self.lastX = drag.deltaX;
            self.setValue( self.slide(self.startValue, self.value, dx, drag.deltaX, {precise:ev.shiftKey, step:ev.ctrlKey}));
            if(ev.altKey){
                self.$el.find('.preset').show();
            }else{
                self.$el.find('.preset').hide(250);
            }
        });
        if(!this.showProgress){
            this.$el.find('.progress').remove();
        }
        if(!this.showIncrement){
            this.$el.find('.arrow').remove();
        }
        this.$el.find('.preset').hide();

        this.render();
    };
    var proto = window.Slider.prototype;


    proto.sortPresets = function(){
        this.sortedPresets = [];
        for(preset in this.presets){
            this.sortedPresets.append(preset);
        }
        this.sortedPresets.sort(function(a,b){ return a.value - b.value; });
    }
    proto.nearestPreset = function(value){
    }
    function powround(value,base){
        base = typeof base === 'undefined' ? 10 : base;
        var power = Math.max(-14,Math.round(Math.log(Math.abs(value))/Math.log(base)));
        return Math.pow(base,power);
    }
    proto.getPrecision = function(value){
        if(this.linear){
            return this.precision;
        }else{
            return Math.max( powround( typeof value === 'undefined' ? this.value: value ) * this.precision, this.maxprecision);
        }
    };
    proto.getStep = function(value){
        if(this.linear){
            return this.step;
        }else{
            return Math.max( powround( typeof value === 'undefined' ? this.value: value ) * this.step, this.minstep);
        }
    };
    proto.decrease = function(){
        this.setValue(this.value - this.getPrecision(this.value));
    };
    proto.increase = function(){
        this.setValue(this.value + this.getPrecision(this.value));
    };
    proto.slide = function(startval,currval,disp,totaldisp,opts){
        if(opts.step){
            var precision = this.getPrecision(startval);
            var step = this.getStep(startval);
            if(opts.precise){
                precision *= this.precise;
                step *= this.precise;
            }
            var nextval = Math.round((startval + totaldisp * precision)/step) * step;
        }else{
            var precision = this.getPrecision(currval);
            if(opts.precise){
                precision *= this.precise;
            }
            var nextval = Math.round( (currval + disp * precision)/precision) * precision;
        }
        return nextval;
    },
    proto.setBounds = function(){
        if(this.value > this.initialmax){
            this.max = this.value;
        }else{
            this.max = this.initialmax;
        }
        if(this.value < this.initialmin){
            this.min = this.value;
        }else{
            this.min = this.initialmin;
        }
        this.render();
    }

    proto.setValue = function(val){
        if(this.looping){
            while(val > this.max){
                val -= (this.max - this.min);
            }
            while(val < this.min){
                val += (this.max - this.min);
            }
        }
        if(val > this.max){
            if(this.hardmax){
                val = this.max;
            }else{
                this.max = val;
            }
        }else if(val < this.min){
            if(this.hardmin){
                val = this.min;
            }else{
                this.min = val;
            }
        }

        this.value = val;
        if(this.set_value){
            this.set_value(val);
        }
        this.render();
    };

    proto.render = function(){
        var power = Math.max(-14,Math.round(Math.log(Math.abs(this.value))/Math.log(10)));
        var decimals = Math.max(this.decimals,this.decimals-power);
        if(this.value === 0 || this.linear){
            decimals = this.decimals;
        }
        this.$el.find('.value').html((this.label ? '<b>'+this.label + '</b>' : '')+this.value.toFixed(decimals));
        if(true || this.value >= 0){
            var pc = Math.round( 100 * (this.value - this.min) / (this.max - this.min) );
            this.$el.find('.progress .indicator').css({'left':0,'right':'auto','width':''+pc+'%'});
        }else{
            var pc = Math.round( 100 * (this.max - this.value) / (this.max - this.min) );
            this.$el.find('.progress .indicator').css({'left':'auto','right':0,'width':''+pc+'%'});
        }
    };
    proto.append = function(selector){
        $(selector).append(this.$el);
    };
    proto.replace = function(selector){
        $(selector).replace(this.$el);
    };
    
    /* ---------------- float image buffers --------------- */

    function Buffer(opts){
        opts = opts || {};
        this.width = opts.width || 100;
        this.height = opts.height || 100;
        this.channels = 3;
        this.pxcount = this.width * this.height * this.channels; 
        this.datalen = this.width * this.height * this.channels;
        this.data   = new Float32Array(this.datalen);
        this.gamma = 2.0;
        if(opts.imgsrc){
            this.readImage(opts.imgsrc);
        }
    }
    window.Buffer = Buffer;
    var proto = Buffer.prototype;

    proto.add = function(buffer){
        for(var i = 0; i < this.pxcount; i++){
            this.data[i] += buffer.data[i];
        }
    };
    proto.addScaled = function(buffer,scale){
        for(var i = 0; i < this.pxcount; i++){
            this.data[i] += buffer.data[i] * scale;
        }
    };

    proto.normalize = function(){
        var pxcount = this.width * this.height;
        var px = this.data;
        var zero = 1/Math.sqrt(3);
        for(var i = 0; i < pxcount; i++){
            var x = i*3;
            var len = Math.sqrt(px[x]*px[x] + px[x+1]*px[x+1] + px[x+2]*px[x+2]);
            if(len === 0){
                px[x] = zero;
                px[x+1] = zero;
                px[x+2] = zero;
            }else{
                len = 1 / len;
                px[x] *= len;
                px[x+1] *= len;
                px[x+2] *= len;
            }
        }
    };
    proto.kmeans = function(k,iter){
        console.log('kmeans');
        if(!k || k < 2){
            k = 2;
        }
        iter = iter || 1;
        var means = [];
        for(i = 0; i < k; i++){
            means.push({val:[i/(k-1),i/(k-1),i/(k-1)],cluster:[]});
            //means.push({val:[Math.random(),Math.random(),Math.random()],cluster:[]});
            console.log('mean:',i,means[i].val);
        }
        var pxcount = this.width * this.height;
        var px = this.data;
        var dists = [];
        while(iter > 0){
            console.log('iter:',iter);
            for(var m = 0; m < k; m++){
                means[m].cluster = [];
            }
            console.log('gathering...');
            for(var x = 0; x < pxcount; x++){
                for(var m = 0; m < k; m++){
                    var col = means[m].val;
                    dists[m] = Math.sqrt( Math.pow(px[x*3]   - col[0],2) +
                                          Math.pow(px[x*3+1] - col[1],2) + 
                                          Math.pow(px[x*3+2] - col[2],2)   );
                }
                var min = 0;
                var mindist = dists[min];
                for(var m = min+1; m < k; m++){
                    if(dists[m] < mindist){
                        mindist = dists[m];
                        min = m;
                    }
                }
                means[min].cluster.push(x*3);
            }
            console.log('centering...');
            for(var m = 0; m < k; m++){
                var cluster = means[m].cluster;
                var clen = cluster.length;
                console.log('clen:',clen);
                var mean = [0,0,0];
                for(var c = 0; c < clen; c++){
                    mean[0] += px[cluster[c]];
                    mean[1] += px[cluster[c]+1];
                    mean[2] += px[cluster[c]+2];
                }
                means[m].val[0] = mean[0] / clen;
                means[m].val[1] = mean[1] / clen;
                means[m].val[2] = mean[2] / clen;
            }
            iter = iter - 1;
        }
        console.log('painting...');
        for(var m = 0; m < k; m++){
            console.log('mean:',i,means[m].val);
            var cluster = means[m].cluster;
            var col = means[m].val;
            var clen = cluster.length;
            for(var c = 0; c < clen; c++){
                px[cluster[c]]   = col[0];
                px[cluster[c]+1] = col[1];
                px[cluster[c]+2] = col[2];
            }
        }
    };
    proto.samplenoise = function(sample,maxsample,buffer,variance){
    };
    proto.sample = function(sample,buffer,variance,maxsample){
        variance = typeof variance === 'undefined' ? 1 : variance;
        maxsample = maxsample || sample;
        var fac = Math.min(1,1/Math.sqrt(sample*0.3));
        function gather(value){
            if(value > 0.001){
                return (Math.random() - 0.5)*fac + value;
            }else{
                return value;
            }
        }
        
        if(sample <= 1){
            for(var i = 0; i < this.datalen; i++){
                this.data[i] = gather(buffer.data[i]); //(Math.random() - 0.5) + buffer.data[i]; //gather(buffer.data[i]);
            }
        }else{
            var fac = 1.0/sample;
            var cfac = (sample - 1) / sample;
            console.log(sample,fac,cfac);
            for(var i = 0; i < this.datalen; i++){
                this.data[i] = this.data[i] * cfac + gather(buffer.data[i]) * fac;
            }
        }
    };
    proto.trace = function(buffer,samplecount, canvasSelector,sampleSelector){
        var self = this;
        if(this.traceInterval){
            clearInterval(this.traceInterval);
        }
        this.traceCurrentSample = 1;
        this.traceInterval = setInterval(function(){
            console.log('tracing sample:',self.traceCurrentSample);
            self.sample(self.traceCurrentSample,buffer,0.5,samplecount);
            if(sampleSelector){
                console.log('yup',sampleSelector,$(sampleSelector));
                $(sampleSelector).html('sample: ' + self.traceCurrentSample);
            }
            self.traceCurrentSample += 1;
            if(canvasSelector){
                self.renderToCanvas(canvasSelector);
            }
            if(self.traceCurrentSample >= samplecount){
                clearInterval(self.traceInterval);
            }
        },1/4.0);
    };

    proto.mult = function(val){
        if(typeof val === 'number'){
            for(var i = 0; i < this.pxcount; i++){
                this.data[i] *= val;
            }
        }else if(val instanceof Array){
            for(var i = 0, len = this.width * this.height; i < len; i++){
                this.data[i*3]   *= val[0];
                this.data[i*3+1] *= val[1];
                this.data[i*3+2] *= val[2];
            }
        }
    };
    proto.set = function(val){
        if(val instanceof Buffer){
            for(var i = 0; i < this.pxcount; i++){
                this.data[i] = val.data[i];
            }
        }else{
            for(var i = 0; i < this.pxcount; i++){
                this.data[i] = val;
            }
        }
    };
    proto.setScaled = function(buffer,scale){
        for(var i = 0; i < this.pxcount; i++){
            this.data[i] = buffer.data[i] * scale;
        }
    };
    proto.renderToCanvas = function(selector){
        var canvas = $(selector)[0];
        if(canvas){
            canvas.width = this.width;
            canvas.height = this.height;
            var ctx = canvas.getContext('2d');
            var img = ctx.createImageData(this.width,this.height);
            var px = img.data;
            var chan = this.channels;
            var gamma = 1.0/this.gamma;
            var pxcount = this.width * this.height;
            for(var i = 0; i < pxcount; i++){
                px[i*4]   = Math.sqrt(this.data[i*chan]) *255;
                px[i*4+1] = Math.sqrt(this.data[i*chan+1])*255;
                px[i*4+2] = Math.sqrt(this.data[i*chan+2])*255;
                px[i*4+3] = 255;
                /*
                 // THIS IS MASSIVELY SLOWER WTF POW ?
                px[i*4]   = Math.round(Math.pow(this.data[i*chan],  gamma)*255);
                px[i*4+1] = Math.round(Math.pow(this.data[i*chan+1],gamma)*255);
                px[i*4+2] = Math.round(Math.pow(this.data[i*chan+2],gamma)*255);
                px[i*4+3] = 255;
                */
            }
            ctx.putImageData(img,0,0);
        }
    };
    proto.readImage = function(path){
        var self = this;
        var img = new Image();
        img.src = path;
        img.onload = function(){
            var canvas = document.createElement('canvas');
            canvas.width = self.width;
            canvas.height = self.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img,0,0);
            imgd = ctx.getImageData(0,0,self.width,self.height);
            var px = imgd.data;
            var gamma = self.gamma;
            var pxcount = self.width * self.height;
            for(var i = 0; i < pxcount; i++){
                var rnd = Math.random()/255.0;
                self.data[i*3]   = Math.pow(px[i*4]/255.0+rnd ,  gamma);
                self.data[i*3+1] = Math.pow(px[i*4+1]/255.0+rnd,  gamma);
                self.data[i*3+2] = Math.pow(px[i*4+2]/255.0+rnd,  gamma);
            }
            console.log('image loaded');
        };
    };
            

    var r = new Buffer({width:800,height:600,imgsrc:'img/RED.png'});
    var b = new Buffer({width:800,height:600,imgsrc:'img/BLUE.png'});
    var g = new Buffer({width:800,height:600,imgsrc:'img/GREEN.png'});
    var tmp = new Buffer({width:800,height:600});
    var d = new Buffer({width:800,height:600});
    var dtr = new Buffer({width:800,height:600});
    window.slide = function(fac){
        var fr = 0, fg = 0, fb = 0;
        if(fac < 1.0/6.0){
            fr = 1.0;
            fg = fac * 6.0;
        }else if(fac < 2.0/6.0){
            fg = 1.0;
            fr = 1-((fac - 1.0/6.0)*6.0);
        }else if(fac < 3.0/6.0){
            fg = 1.0;
            fb = (fac -2.0/6.0) * 6.0;
        }else if(fac < 4.0/6.0){
            fg = 1-((fac - 3.0/6.0)*6.0);
            fb = 1.0;
        }else if(fac < 5.0/6.0){
            fb = 1.0;
            fr = (fac - 4.0/6.0) * 6.0;
        }else{
            fr = 1.0;
            fb = 1-((fac - 5.0/6.0)*6.0);
        }
        var norm = 1.0/Math.sqrt(fr*fr + fg*fg + fb*fb);
        fr *= norm;
        fg *= norm;
        fb *= norm;

        /*
        tmp.set(r);
        tmp.mult(fr);
        d.set(tmp);
        tmp.set(g);
        tmp.mult(fg);
        d.add(tmp);
        tmp.set(b);
        tmp.mult(fb);
        */
        d.setScaled(r,fr);
        d.addScaled(g,fg);
        d.addScaled(b,fb);
        //d.renderToCanvas('canvas.blend');
        dtr.trace(d,100,'canvas.blend','.view.blending .sample');
    }

    window.slider = new Slider({label:'hue',hardmin:true, hardmax:true, linear:true, looping:true, set_value:slide});
    slider.append('.view.blending .controls');
    setTimeout(function(){slider.setValue(0.5);},1000);

    var normalizeFac = 0.5;
    var normalizeA = new Buffer({width:800,height:600,imgsrc:'img/a.jpg'});
    //var normalizeA = new Buffer({width:800,height:600,imgsrc:'img/LIGHTINGCEILING.png'});
    var normalizeB = null;
    var normalizeDst = new Buffer({width:800, height:600});
    var normalizeTmp = new Buffer({width:800, height:600});

    function renderNormalize(){
        if(!normalizeB){
            normalizeB = new Buffer({width:800, height: 600});
            normalizeB.set(normalizeA);
            normalizeB.kmeans(5,10);
        }
        normalizeDst.setScaled(normalizeA,1-normalizeFac);
        normalizeDst.addScaled(normalizeB,normalizeFac);
        normalizeDst.renderToCanvas('.view.normalize canvas');
    }

    (new Slider({label:'Normalize',hardmin:true, hardmax:true, linear:true, value:normalizeFac, set_value:function(val){
        normalizeFac = val;
        renderNormalize();
    }})).append('.view.normalize .controls');

    setTimeout(function(){renderNormalize();},1000);

    var ceil = new Buffer({width:800,height:600,imgsrc:'img/LIGHTINGCEILING.png'});
    var balls = new Buffer({width:800,height:600,imgsrc:'img/LIGHTINGBALLSDIM.png'});
    var blocks = new Buffer({width:800,height:600,imgsrc:'img/LIGHTINGBLOCKS.png'});
    var lights = new Buffer({width:800,height:600});
    
    var ceil_intensity = 7;
    var ceil_color = [0,0.26,1];
    var balls_intensity = 75;
    var balls_color = [1,0.07,0];
    var blocks_intensity = 0.3;
    var blocks_color = [0,0,1];

    function renderLight(){
        tmp.set(ceil);
        tmp.mult(ceil_intensity);
        tmp.mult(ceil_color);
        lights.set(tmp);
        tmp.set(balls);
        tmp.mult(balls_intensity/10.0);
        tmp.mult(balls_color);
        lights.add(tmp);
        tmp.set(blocks);
        tmp.mult(blocks_intensity);
        tmp.mult(blocks_color);
        lights.add(tmp);
        lights.renderToCanvas('canvas.lights');
    }
    function new_color_slider(label,color,selector){
        (new Slider({label:label+' R',hardmin:true,hardmax:true, value:color[0], set_value:function(val){
            color[0] = val;
            renderLight();
        }})).append(selector);
        (new Slider({label:label+' G',hardmin:true,hardmax:true, value:color[1], set_value:function(val){
            color[1] = val;
            renderLight();
        }})).append(selector);
        (new Slider({label:label+' B',hardmin:true,hardmax:true, value:color[2], set_value:function(val){
            color[2] = val;
            renderLight();
        }})).append(selector);
        
    }
    
    new_color_slider('Ceiling',ceil_color,'.view.lights .controls .group.left');
    (new Slider({label:'Ceiling',hardmin:true, showProgress:false, value:ceil_intensity, set_value:function(val){
        ceil_intensity = val;
        renderLight();
    }})).append('.view.lights .controls .group.left');

    new_color_slider('Balls',  balls_color,'.view.lights .controls .group.center');
    (new Slider({label:'Balls',hardmin:true, showProgress:false, value:balls_intensity, set_value:function(val){
        balls_intensity = val;
        renderLight();
    }})).append('.view.lights .controls .group.center');

    new_color_slider('Blocks', blocks_color,'.view.lights .controls .group.right');
    (new Slider({label:'Blocks',hardmin:true, showProgress:false, value:blocks_intensity, set_value:function(val){
        blocks_intensity = val;
        renderLight();
    }})).append('.view.lights .controls .group.right');
    setTimeout(function(){renderLight();},1000);
}
