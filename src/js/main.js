window.onload = function(){
    window.slider_template = 
        "<span class='slider'> \
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
        });
        this.$el.find('.slide').bind('drag',function(ev,drag){ 
            var dx = drag.deltaX - self.lastX;
            self.lastX = drag.deltaX;
            self.setValue( self.slide(self.startValue, self.value, dx, drag.deltaX, {precise:ev.shiftKey, step:ev.ctrlKey}));
        });
        if(!this.showProgress){
            this.$el.find('.progress').remove();
        }
        if(!this.showIncrement){
            this.$el.find('.arrow').remove();
        }

        this.render();
    };
    var proto = window.Slider.prototype;


    function powround(value,base){
        base = typeof base === 'undefined' ? 10 : base;
        var power = Math.max(-14,Math.round(Math.log(Math.abs(value))/Math.log(base)));
        return Math.pow(base,power);
    }
    proto.getPrecision = function(value){
        return Math.max( powround( typeof value === 'undefined' ? this.value: value ) * this.precision, this.maxprecision);
    };
    proto.getStep = function(value){
        return Math.max( powround( typeof value === 'undefined' ? this.value: value ) * this.step, this.minstep);
    };
    proto.decrease = function(){
        this.setValue(this.value - this.increment);
    };
    proto.increase = function(){
        this.setValue(this.value + this.increment);
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
        this.render();
    };

    proto.render = function(){
        var power = Math.max(-14,Math.round(Math.log(Math.abs(this.value))/Math.log(10)));
        var decimals = Math.max(this.decimals,this.decimals-power);
        if(this.value === 0){
            decimals = this.decimals;
        }
        this.$el.find('.value').html(this.value.toFixed(decimals));
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

    new window.Slider().append('.main');
    new window.Slider({showProgress:false}).append('.main');
    new window.Slider({showIncrement:false}).append('.main');
}
