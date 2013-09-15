$(function() {
    report.getFeatures(function() {
        report.drawFeaturesIn($("body"));
    });     

    $(function() {
        $(document).tooltip();
    });
});

var report = {
    
    features: [],

    getFeatures: function(callback) {
        var self = this;
        $.getJSON('report.json', function(data) {
            $.each(data, function(key, value) {
                console.log(value);
                self.features.push(new Report.Feature(value.id, value.name, value.uri, value.elements));
            });
            console.log(self.features);
            callback();
        }); 
    },

    isPassed: function() {
        for (var i = 0; i < this.features.length; i++) {
            if (this.features[i].isPassed() === false) {
                return false;
            }
        }
        return true;
    },

    getDuration: function() {
        var duration = 0;
        for (var i = 0; i < this.features.length; i++) {
            duration += this.features[i].getDuration();
        }
        return duration;        
    },

    getPassedStepCount: function() {
        var stepCount = 0;
        for (var i = 0; i < this.features.length; i++) {
            stepCount += this.features[i].getPassedStepCount();
        }
        return stepCount;
    },

    getFailedStepCount: function() {
        var stepCount = 0;
        for (var i = 0; i < this.features.length; i++) {
            stepCount += this.features[i].getFailedStepCount();
        }
        return stepCount;
    },

    drawFeaturesIn: function($target) {
        var self = this;

        var $mainHeader = $('<div class="main-header ' + (self.isPassed() ? "passed" : "failed") + '"></div>');
        $target.append($mainHeader);

        // Add duration
        $mainHeader.append('<h1 class="duration">' + Report.HumanizeDuration(self.getDuration()) + '</h1>');

        // Add passed step count
        $mainHeader.append('<span class="step-count step-count-passed">' + self.getPassedStepCount() + ' passed steps</span>');

        // Add failed step count
        $mainHeader.append('<span class="step-count step-count-failed">' + self.getFailedStepCount() + ' failed steps</span>');

        for (var i = 0; i < self.features.length; i++) {

            var hasCaptures = false;

            var $feature = $('<div class="feature"><h2>' + self.features[i].name + '</h2><span class="uri">' + self.features[i].uri + '</span></div>');
            $target.append($feature);

            // Add duration            
            $feature.append('<span class="duration">' + Report.HumanizeDuration(self.features[i].getDuration()) + '</span>'); 

            var $scenarios = $('<div class="scenarios"></div>'); 
            $feature.append($scenarios);

            for (var j = 0; j < self.features[i].scenarios.length; j++) {
                
                // Create scenario view
                var $scenario = $('<div id="scenario-' + self.features[i].scenarios[j].id + '" class="scenario"></div>');
                $scenarios.append($scenario);

                // Add heading, which contains basic info and allows action when the scenario is collapsed
                var $heading = $('<div class="heading"></div>');
                $heading.attr("title", self.features[i].scenarios[j].name);
                $heading.click(function(event) {
                    self.expandScenario($(event.currentTarget).parent(".scenario"));
                });
                $heading.tooltip({position: {my: 'center', at: 'center center+45'}});
                $scenario.append($heading);

                // Create scenario contents
                var $scenarioContents = $('<div class="scenario-contents"></div>');
                $scenario.append($scenarioContents);
                $scenario.addClass(self.features[i].scenarios[j].isPassed() ? "passed" : "failed"),
                $scenarioContents.hide();

                // Create H3
                var $h3 = $('<h3>' + self.features[i].scenarios[j].name + '</h3>');
                $scenarioContents.append($h3);
                $h3.hide();

                // Add toggle button
                var $toggleStepLink = $('<a class="toggle-steps">Toggle steps (' + self.features[i].scenarios[j].steps.length + ')</a>');
                $toggleStepLink.data("scenarioId", self.features[i].scenarios[j].id);
                $toggleStepLink.click(function(event) {
                    self.collapseScenarioSteps(event.target);
                });
                $scenarioContents.append($toggleStepLink);
                
                // Create step container
                var $steps = $('<div class="steps"></div>');
                $scenarioContents.append($steps);

                // Create capture container
                var $captures = $('<div class="captures"></div>');
                $scenarioContents.append($captures);

                // Process all steps
                for (var k = 0; k < self.features[i].scenarios[j].steps.length; k++) {
                    var $step = $('<div class="step">' + 
                            '<h4>' + 
                                '<span class="line">' + self.features[i].scenarios[j].steps[k].line + '</span> ' +
                                '<span class="keyword">' + self.features[i].scenarios[j].steps[k].keyword + '</span>' +
                                '<span class="name">' + self.features[i].scenarios[j].steps[k].name + '</span> ' +
                                '<span class="duration">(' + Report.HumanizeDuration(self.features[i].scenarios[j].steps[k].result.duration) + ')</span>' +
                            '</h4>' + 
                            '<span class="location">' + self.features[i].scenarios[j].steps[k].match.location + '</span>' + 
                        '</div>');
                    $step.addClass(self.features[i].scenarios[j].steps[k].result.status == "passed" ? "passed" : "failed");
                    
                    // Add error
                    if (self.features[i].scenarios[j].steps[k].result.status == "failed") {
                        $step.append('<div class="error-message">' + self.features[i].scenarios[j].steps[k].result.error_message + '</div>');
                    }
                    $steps.append($step);

                    if (typeof(self.features[i].scenarios[j].steps[k].embeddings) != "undefined") {
                        hasCaptures = true;

                        $step.addClass("embeddings");
                        for (var l = 0; l < self.features[i].scenarios[j].steps[k].embeddings.length; l++) {
                            $stepEmbedding = $('<img class="step-embedding" src="data:' + self.features[i].scenarios[j].steps[k].embeddings[l].mime_type + ';base64,' + self.features[i].scenarios[j].steps[k].embeddings[l].data + '">');
                            $stepEmbedding.click(function(event) {
                                self.enlargeImage(event.currentTarget);
                            });
                            $step.append($stepEmbedding);
                            
                            var $capture = $('<img class="capture" src="data:' + self.features[i].scenarios[j].steps[k].embeddings[l].mime_type + ';base64,' + self.features[i].scenarios[j].steps[k].embeddings[l].data + '">');
                            $capture.click(function(event) {
                                self.enlargeImage(event.currentTarget);
                            })                            
                            $captures.append($capture);
                        }
                    } 
                }
                $steps.hide();
            }  

            // Add animate captures button, if any
            if (hasCaptures) {            
                var $animateCapturesLink = $('<a class="animate-captures">Animate captures</a>');
                $animateCapturesLink.data("scenarioId", self.features[i].id);
                $animateCapturesLink.click(function(event) {
                    self.animateCaptures(event.target);
                });
                $scenarios.before($animateCapturesLink);   
            }       
        }
    },

    collapseScenarioSteps: function(elem) {
        $("#scenario-" + $(elem).data("scenarioId")).find(".steps").toggle();
        $("#scenario-" + $(elem).data("scenarioId")).find(".captures").toggle();
    },

    enlargeImage: function(elem) {
        var $captures = $(elem).closest(".feature").find($(elem).hasClass("capture") ? '.capture' : '.step-embedding');
        $captures.colorbox.remove();
        $captures.colorbox({
            rel: 'gallery',
            inline: true,
            slideshow: true,
            className: 'capture-gallery',
            href: function(){ return this; }
        });
    },

    animateCaptures: function(elem) {
        var $captures = $(elem).closest(".feature").find(".capture");
        $captures.colorbox.remove();
        $captures.colorbox({
            rel: 'gallery', 
            className: 'capture-slideshow',
            inline: true,
            open: true,
            slideshow: true,
            slideshowSpeed: 500,
            slideshowAuto: true,
            href: function(){ return this; }
        });
    },

    expandScenario: function(elem) {
        $(elem).toggleClass("expanded");
        $(elem).find("h3").toggle();
        $(elem).find(".scenario-contents").toggle();  
        $(elem).find(".heading").tooltip("option", "disabled", !$(elem).find(".heading").tooltip("option", "disabled"));
    }
};

var Report = {

    HumanizeDuration: function(duration) {
        var duration = countdown(0, duration / 1000000, null, countdown.DEFAULTS);
        if (duration == null || duration == 0) {
            return '0 seconds';
        }
        return duration.toString();
    },

    Feature: function(id, name, uri, scenarios) {
        var self = this;

        this.id = id;
        this.name = name;
        this.uri = uri;
        this.scenarios = [];

        for (var i = 0; i < scenarios.length; i++) {
            this.scenarios.push(new Report.Scenario(scenarios[i].name, scenarios[i].steps, scenarios[i].id));
        }

        this.isPassed = function() {
            if (typeof(self._passed) === "undefined") {
                self._passed = true;
                for (var i = 0; i < self.scenarios.length; i++) {
                    if (!self.scenarios[i].isPassed()) {
                        self._passed = false;
                        break;
                    }
                }                
            }
            return self._passed;
        };

        this.getDuration = function() {
            if (typeof(self._duration) === "undefined") {
                self._duration = 0;
                for (var i = 0; i < self.scenarios.length; i++) {
                    self._duration += self.scenarios[i].getDuration();
                }
            }
            return self._duration;
        };

        this.getFailedStepCount = function() {
            if (typeof(self._failedStepCount) === "undefined") {
                self._failedStepCount = 0;
                for (var i = 0; i < self.scenarios.length; i++) {
                    self._failedStepCount += self.scenarios[i].getFailedStepCount();
                }
            }
            return self._failedStepCount;
        };

        this.getPassedStepCount = function() {
            if (typeof(self._passedStepCount) === "undefined") {
                self._passedStepCount = 0;
                for (var i = 0; i < self.scenarios.length; i++) {
                    self._passedStepCount += self.scenarios[i].getPassedStepCount();
                }
            }
            return self._passedStepCount;
        };
    },

    Scenario: function(name, steps, id) {
        var self = this;

        this.name = name;
        this.steps = steps;
        this.id = id.replace(";", "-");

        this.isPassed = function() {
            if (typeof(self._passed) === "undefined") {
                self._passed = true;
                for (var i = 0; i < self.steps.length; i++) {
                    if (self.steps[i].result.status != "passed") {
                        self._passed = false;
                        break;
                    }
                }                
            }
            return self._passed;
        };

        this._processSteps = function() {
            self._passedStepCount = 0;
            self._failedStepCount = 0;

            for (var i = 0; i < self.steps.length; i++) {
                if (self.steps[i].result.status === "passed") {
                    self._passedStepCount++;
                } else {
                    self._failedStepCount++;
                }
            }
        }

        this.getDuration = function() {
            if (typeof(self._duration) === "undefined") {
                self._duration = 0;
                for (var i = 0; i < self.steps.length; i++) {
                    self._duration += self.steps[i].result.duration;
                }
            }
            return self._duration;
        };

        this.getFailedStepCount = function() {
            return self._failedStepCount;
        };

        this.getPassedStepCount = function() {
            return self._passedStepCount;
        };

        this._processSteps();
    }
}