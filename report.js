$(function() {
    report.getFeatures(function() {

        report.drawFeaturesIn($("body"));

        //report.postProcessFeatures();
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
                self.features.push(new Report.Feature(value.name, value.uri, value.elements));
            });
            console.log(self.features);
            callback();
        }); 
    },

    drawFeaturesIn: function($target) {
        var self = this;
        for (var i = 0; i < self.features.length; i++) {

            var $feature = $('<div class="feature"><h2>' + self.features[i].name + '</h2><span class="uri">' + self.features[i].uri + '</span></div>');
            $target.append($feature);

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
                $heading.tooltip();
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
                var $toggleStepLink = $('<a class="toggle-steps">Toggle steps</a>');
                $toggleStepLink.data("scenarioId", self.features[i].scenarios[j].id);
                $toggleStepLink.click(function(event) {
                    self.collapseScenarioSteps(event.target);
                });
                $scenarioContents.append($toggleStepLink);
                
                // Create step container
                $steps = $('<div class="steps"></div>');
                $scenarioContents.append($steps);

                // Create capture container
                $captures = $('<div class="captures"></div>');
                $scenarioContents.append($captures);

                // Process all steps
                for (var k = 0; k < self.features[i].scenarios[j].steps.length; k++) {
                    $step = $('<div class="step">' + 
                            '<h4>' + 
                                '<span class="keyword">' + self.features[i].scenarios[j].steps[k].keyword + '</span>' +
                                '<span class="name">' + self.features[i].scenarios[j].steps[k].name + '</span>' +
                            '</h4>' + 
                            '<span class="location">' + self.features[i].scenarios[j].steps[k].match.location + '</span>' + 
                        '</div>');
                    $step.addClass(self.features[i].scenarios[j].steps[k].result.status == "passed" ? "passed" : "failed");
                    $steps.append($step);

                    if (typeof(self.features[i].scenarios[j].steps[k].embeddings) != "undefined") {
                        $step.addClass("embeddings");
                        for (var l = 0; l < self.features[i].scenarios[j].steps[k].embeddings.length; l++) {
                            $step.append('<img src="data:' + self.features[i].scenarios[j].steps[k].embeddings[l].mime_type + ';base64,' + self.features[i].scenarios[j].steps[k].embeddings[l].data + '">');
                        
                            $capture = $('<div class="capture"><img src="data:' + self.features[i].scenarios[j].steps[k].embeddings[l].mime_type + ';base64,' + self.features[i].scenarios[j].steps[k].embeddings[l].data + '"></div>');
                            $capture.colorbox({
                                rel:'my-group', 
                                inline: true,
                                href: function(){ return this; }
                            });
                            $captures.append($capture);
                        }
                    } 
                }
                $steps.hide();
            }            
        }
    },

    collapseScenarioSteps: function(elem) {
        $("#scenario-" + $(elem).data("scenarioId")).find(".steps").toggle();
        $("#scenario-" + $(elem).data("scenarioId")).find(".embeddings").toggle();
    },

    expandScenario: function(elem) {
        $(elem).toggleClass("expanded");
        $(elem).find("h3").toggle();
        $(elem).find(".scenario-contents").toggle();  
        $(elem).find(".heading").tooltip("option", "disabled", !$(elem).find(".heading").tooltip("option", "disabled"));
    },

    postProcessFeatures: function() {
        var self = this;

        var numberOfFeatures = $(".features").length;

        $(".feature").each(function() {

            var self = this;
            var h3 = $(this).find("h3");
            $(this).data("originalH3", h3.html());
            $(this).data("scenarioFile", $(this).find(".scenario_file"));
            $(this).find(".scenario_file").html("");
            h3.html("");

            var $toggleStepLink = $('<a class="toggleSteps">Toggle steps</a>');
            $(self).find("ol").before($toggleStepLink);
            $toggleStepLink.click(function() {
            if ($(self).data("stepCollapsed") == true) {
            $(self).data("stepCollapsed", false);
            $(self).find("li").show();
            } else {
            $(self).data("stepCollapsed", true);
            $(self).find("li").hide();
            }          
            });

            h3.click(function() {
            if ($(self).hasClass("closed")) {
            $(self).find("a").hide();

            $(self).data("stepCollapsed", true);

            $(self).find("li").hide();
            $(self).removeClass("closed");
            $(self).addClass("open");
            $(self).width("100%");
            console.log($(self).data("originalH3"));
            $(self).find("h3").html($(self).data("originalH3"));
            $(self).find(".scenarioFile").html($(self).data("scenarioFile"));

            $(self).find("img").each(function() {
            var image = $(this);
            $(this).show();
            $(this).addClass("mini");
            $(this).click(function() {
            $(this).toggleClass("maxi");
            });
            });

            } else {
            $(self).removeClass("open");
            $(self).addClass("closed");
            $(self).width(100 / numberOfScenarios + "%");
            $(self).find("h3").html("");
            $(self).find(".scenarioFile").html("");
            }
            });

            $(this).width(100 / numberOfScenarios + "%");
            $(this).addClass("closed");
            $(this).find("ol").each(function() {
            $(this).hide();
            });
        });

    }
};

var Report = {
    Feature: function(name, uri, scenarios) {
        var self = this;

        this.name = name;
        this.uri = uri;
        this.scenarios = [];
        for (var i = 0; i < scenarios.length; i++) {
            this.scenarios.push(new Report.Scenario(scenarios[i].name, scenarios[i].steps, scenarios[i].id));
        }

        this.isPassed = function() {
            if (typeof(self._passed) == "undefined") {
                for (var i = 0; i < self.steps.length; i++) {
                    if (!self.scenarios[i].isPassed()) {
                        self._passed = false;
                        break;
                    }
                }
                self._passed = true;
            }
            return self._passed;
        }

        this.getDuration = function() {
            if (typeof(self._duration) == "undefined") {
                self._duration = 0;
                for (var i = 0; i < self.scenarios.length; i++) {
                    self._duration += self.scenarios[i].getDuration();
                }
            }
            return self._duration;
        }
    },

    Scenario: function(name, steps, id) {
        var self = this;

        this.name = name;
        this.steps = steps;
        this.id = id.replace(";", "-");

        this.isPassed = function() {
            if (typeof(self._passed) == "undefined") {
                for (var i = 0; i < self.steps.length; i++) {
                    if (self.steps[i].result.status != "passed") {
                        self._passed = false;
                        break;
                    }
                }
                self._passed = true;
            }
            return self._passed;
        }

        this.getDuration = function() {
            if (typeof(self._duration) == "undefined") {
                self._duration = 0;
                for (var i = 0; i < self.steps.length; i++) {
                    self._duration += self.steps[i].result._duration;
                }
            }
            return self._duration;
        }
    }
}