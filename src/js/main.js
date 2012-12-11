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
        this.data   = new Float32Array(this.pxcount);
        this.gamma = 2.2;
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
    proto.mult = function(val){
        for(var i = 0; i < this.pxcount; i++){
            this.data[i] *= val;
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
    proto.renderToCanvas = function(selector){
        var canvas = $(selector)[0];
        if(canvas){
            canvas.width = this.width;
            canvas.height = this.height;
            var ctx = canvas.getContext('2d');
            var img = ctx.createImageData(this.width,this.height);
            var px = img.data;
            var chan = this.channels;
            var gamma = this.gamma;
            var pxcount = this.width * this.height;
            for(var i = 0; i < pxcount; i++){
                px[i*4]   = Math.round(Math.pow(this.data[i*chan],  gamma)*255);
                px[i*4+1] = Math.round(Math.pow(this.data[i*chan+1],gamma)*255);
                px[i*4+2] = Math.round(Math.pow(this.data[i*chan+2],gamma)*255);
                px[i*4+3] = 255;
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
            var gamma = 1.0/self.gamma;
            var pxcount = self.width * self.height;
            for(var i = 0; i < pxcount; i++){
                self.data[i*3]   = Math.pow(px[i*4]/255.0,  gamma);
                self.data[i*3+1] = Math.pow(px[i*4+1]/255.0,  gamma);
                self.data[i*3+2] = Math.pow(px[i*4+2]/255.0,  gamma);
            }
            console.log('image loaded');
        };
    };
            

    var a = new Buffer({width:800,height:600,imgsrc:'img/a.jpg'});
    var b = new Buffer({width:800,height:600,imgsrc:'img/b.jpg'});
    var tmp = new Buffer({width:800,height:600});
    var c = new Buffer({width:800,height:600});
    window.slide = function(fac){
        tmp.set(a);
        tmp.mult(fac);
        c.set(tmp);
        tmp.set(b);
        tmp.mult(1-fac);
        c.add(tmp);
        c.renderToCanvas('canvas');
    }

    window.slider = new Slider({label:'factor',hardmin:true, hardmax:true, linear:true, set_value:slide});
    slider.append('.view.blending .controls');
    setTimeout(function(){slider.setValue(0.5);},1000);
}
