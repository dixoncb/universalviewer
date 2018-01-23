// iiif-av-component v0.0.15 https://github.com/iiif-commons/iiif-av-component#readme
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.iiifAvComponent = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/// <reference types="exjs" /> 

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var IIIFComponents;
(function (IIIFComponents) {
    var AVComponent = /** @class */ (function (_super) {
        __extends(AVComponent, _super);
        function AVComponent(options) {
            var _this = _super.call(this, options) || this;
            _this._data = _this.data();
            _this.canvasInstances = [];
            _this._init();
            _this._resize();
            return _this;
        }
        AVComponent.prototype._init = function () {
            var success = _super.prototype._init.call(this);
            if (!success) {
                console.error("Component failed to initialise");
            }
            return success;
        };
        AVComponent.prototype.data = function () {
            return {
                autoPlay: false,
                defaultAspectRatio: 0.56,
                limitToRange: false,
                content: {
                    play: "Play",
                    pause: "Pause",
                    currentTime: "Current Time",
                    duration: "Duration"
                }
            };
        };
        AVComponent.prototype.set = function (data) {
            // changing any of these data properties forces a reload.
            if (this._propertiesChanged(data, ['helper'])) {
                $.extend(this._data, data);
                // reset all global properties and terminate all running processes
                // create canvases
                this._reset();
            }
            else {
                // no need to reload, just update.
                $.extend(this._data, data);
            }
            // update
            this._update();
            // resize everything
            this._resize();
        };
        AVComponent.prototype._propertiesChanged = function (data, properties) {
            var propChanged = false;
            for (var i = 0; i < properties.length; i++) {
                propChanged = this._propertyChanged(data, properties[i]);
                if (propChanged) {
                    break;
                }
            }
            return propChanged;
        };
        AVComponent.prototype._propertyChanged = function (data, propertyName) {
            return !!data[propertyName] && this._data[propertyName] !== data[propertyName];
        };
        AVComponent.prototype._reset = function () {
            for (var i = 0; i < this.canvasInstances.length; i++) {
                var canvasInstance = this.canvasInstances[i];
                canvasInstance.destroy();
            }
            this.canvasInstances = [];
            this._$element.empty();
            var canvases = this._getCanvases();
            for (var i = 0; i < canvases.length; i++) {
                this._initCanvas(canvases[i]);
            }
        };
        AVComponent.prototype._update = function () {
            for (var i = 0; i < this.canvasInstances.length; i++) {
                var canvasInstance = this.canvasInstances[i];
                canvasInstance.update(this._data);
            }
        };
        AVComponent.prototype._getCanvases = function () {
            if (this._data.helper) {
                return this._data.helper.getCanvases();
            }
            return [];
        };
        AVComponent.prototype._initCanvas = function (canvas) {
            var _this = this;
            var canvasInstance = new IIIFComponents.CanvasInstance(canvas, this._data);
            canvasInstance.logMessage = this._logMessage.bind(this);
            this._$element.append(canvasInstance.$playerElement);
            canvasInstance.init();
            this.canvasInstances.push(canvasInstance);
            canvasInstance.on('canvasready', function () {
                //that._logMessage('CREATED CANVAS: ' + canvasInstance.canvasClockDuration + ' seconds, ' + canvasInstance.canvasWidth + ' x ' + canvasInstance.canvasHeight + ' px.');
                _this.fire(AVComponent.Events.CANVASREADY);
            }, false);
        };
        AVComponent.prototype.getCanvasInstanceById = function (canvasId) {
            canvasId = manifesto.Utils.normaliseUrl(canvasId);
            for (var i = 0; i < this.canvasInstances.length; i++) {
                var canvasInstance = this.canvasInstances[i];
                if (canvasInstance.canvas && canvasInstance.canvas.id) {
                    var canvasInstanceId = manifesto.Utils.normaliseUrl(canvasInstance.canvas.id);
                    if (canvasInstanceId === canvasId) {
                        return canvasInstance;
                    }
                }
            }
            return null;
        };
        AVComponent.prototype.play = function (canvasId) {
            this.showCanvas(canvasId);
            var canvasInstance = this.getCanvasInstanceById(canvasId);
            if (canvasInstance) {
                var temporal = /t=([^&]+)/g.exec(canvasId);
                if (temporal && temporal.length > 1) {
                    var rangeTiming = temporal[1].split(',');
                    var duration = new IIIFComponents.AVComponentObjects.Duration(Number(rangeTiming[0]), Number(rangeTiming[1]));
                    canvasInstance.currentDuration = duration;
                    canvasInstance.highlightDuration();
                    canvasInstance.setCurrentTime(duration.start);
                    canvasInstance.play();
                }
            }
        };
        AVComponent.prototype.showCanvas = function (canvasId) {
            // pause all canvases
            for (var i = 0; i < this.canvasInstances.length; i++) {
                this.canvasInstances[i].pause();
            }
            // hide all players
            this._$element.find('.player').hide();
            var canvasInstance = this.getCanvasInstanceById(canvasId);
            if (canvasInstance && canvasInstance.$playerElement) {
                canvasInstance.$playerElement.show();
            }
        };
        AVComponent.prototype._logMessage = function (message) {
            this.fire(AVComponent.Events.LOG, message);
        };
        AVComponent.prototype.resize = function () {
            this._resize();
        };
        AVComponent.prototype._resize = function () {
            // loop through all canvases resizing their elements
            for (var i = 0; i < this.canvasInstances.length; i++) {
                var canvasInstance = this.canvasInstances[i];
                canvasInstance.resize();
            }
        };
        return AVComponent;
    }(_Components.BaseComponent));
    IIIFComponents.AVComponent = AVComponent;
})(IIIFComponents || (IIIFComponents = {}));
(function (IIIFComponents) {
    var AVComponent;
    (function (AVComponent) {
        var Events = /** @class */ (function () {
            function Events() {
            }
            Events.CANVASREADY = 'canvasready';
            Events.PLAYCANVAS = 'play';
            Events.PAUSECANVAS = 'pause';
            Events.LOG = 'log';
            return Events;
        }());
        AVComponent.Events = Events;
    })(AVComponent = IIIFComponents.AVComponent || (IIIFComponents.AVComponent = {}));
})(IIIFComponents || (IIIFComponents = {}));
(function (g) {
    if (!g.IIIFComponents) {
        g.IIIFComponents = IIIFComponents;
    }
    else {
        g.IIIFComponents.AVComponent = IIIFComponents.AVComponent;
    }
})(global);

var IIIFComponents;
(function (IIIFComponents) {
    var CanvasInstance = /** @class */ (function () {
        function CanvasInstance(canvas, data) {
            this._highPriorityFrequency = 25;
            this._lowPriorityFrequency = 100;
            this._canvasClockDuration = 0; // todo: should these 0 values be undefined by default?
            this._canvasClockFrequency = 25;
            this._canvasClockStartDate = 0;
            this._canvasClockTime = 0;
            this._canvasHeight = 0;
            this._canvasWidth = 0;
            this._isPlaying = false;
            this._isStalled = false;
            this._readyCanvasesCount = 0;
            this._stallRequestedBy = []; //todo: type
            this._wasPlaying = false;
            this.currentDuration = null;
            this.canvas = canvas;
            this._data = data;
            this.$playerElement = $('<div class="player"></div>');
        }
        CanvasInstance.prototype.init = function () {
            var _this = this;
            this._$canvasContainer = $('<div class="canvasContainer"></div>');
            this._$optionsContainer = $('<div class="optionsContainer"></div>');
            this._$rangeTimelineContainer = $('<div class="rangeTimelineContainer"></div>');
            this._$canvasTimelineContainer = $('<div class="canvasTimelineContainer"></div>');
            this._$durationHighlight = $('<div class="durationHighlight"></div>');
            this._$timelineItemContainer = $('<div class="timelineItemContainer"></div>');
            this._$controlsContainer = $('<div class="controlsContainer"></div>');
            this._$playButton = $('<button class="playButton">' + this._data.content.play + '</button>');
            this._$timingControls = $('<span>' + this._data.content.currentTime + ': <span class="canvasTime"></span> / ' + this._data.content.duration + ': <span class="canvasDuration"></span></span>');
            this._$volumeControl = $('<input type="range" class="volume" min="0" max="1" step="0.01" value="1">');
            this._$canvasTime = this._$timingControls.find('.canvasTime');
            this._$canvasDuration = this._$timingControls.find('.canvasDuration');
            this._$controlsContainer.append(this._$playButton, this._$timingControls, this._$volumeControl);
            this._$canvasTimelineContainer.append(this._$durationHighlight);
            this._$optionsContainer.append(this._$canvasTimelineContainer, this._$rangeTimelineContainer, this._$timelineItemContainer, this._$controlsContainer);
            this.$playerElement.append(this._$canvasContainer, this._$optionsContainer);
            this._canvasClockDuration = this.canvas.getDuration();
            var canvasWidth = this.canvas.getWidth();
            var canvasHeight = this.canvas.getHeight();
            if (!canvasWidth) {
                this._canvasWidth = this.$playerElement.parent().width(); // this._data.defaultCanvasWidth;
            }
            else {
                this._canvasWidth = canvasWidth;
            }
            if (!canvasHeight) {
                this._canvasHeight = this._canvasWidth * this._data.defaultAspectRatio; //this._data.defaultCanvasHeight;
            }
            else {
                this._canvasHeight = canvasHeight;
            }
            var that = this;
            this._$playButton.on('click', function () {
                if (_this._isPlaying) {
                    _this.pause();
                }
                else {
                    _this.play();
                }
            });
            this._$volumeControl.on('input', function () {
                that.setVolume(Number(this.value));
            });
            this._$volumeControl.on('change', function () {
                that.setVolume(Number(this.value));
            });
            this._$canvasTimelineContainer.slider({
                value: 0,
                step: 0.01,
                orientation: "horizontal",
                range: "min",
                max: that._canvasClockDuration,
                animate: false,
                create: function (evt, ui) {
                    // on create
                },
                slide: function (evt, ui) {
                    that.setCurrentTime(ui.value);
                },
                stop: function (evt, ui) {
                    //this.setCurrentTime(ui.value);
                }
            });
            // create annotations
            this._contentAnnotations = [];
            var items = this.canvas.__jsonld.content[0].items; //todo: use canvas.getContent()
            if (items.length === 1) {
                this._$timelineItemContainer.hide();
            }
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                /*
                if (item.motivation != 'painting') {
                    return null;
                }
                */
                var mediaSource = void 0;
                if (Array.isArray(item.body) && item.body[0].type.toLowerCase() === 'choice') {
                    // Choose first "Choice" item as body
                    var tmpItem = item;
                    item.body = tmpItem.body[0].items[0];
                    mediaSource = item.body.id.split('#')[0];
                }
                else if (item.body.type.toLowerCase() === 'textualbody') {
                    mediaSource = item.body.value;
                }
                else {
                    mediaSource = item.body.id.split('#')[0];
                }
                /*
                var targetFragment = (item.target.indexOf('#') != -1) ? item.target.split('#t=')[1] : '0, '+ canvasClockDuration,
                    fragmentTimings = targetFragment.split(','),
                    startTime = parseFloat(fragmentTimings[0]),
                    endTime = parseFloat(fragmentTimings[1]);

                //TODO: Check format (in "target" as MFID or in "body" as "width", "height" etc.)
                var fragmentPosition = [0, 0, 100, 100],
                    positionTop = fragmentPosition[1],
                    positionLeft = fragmentPosition[0],
                    mediaWidth = fragmentPosition[2],
                    mediaHeight = fragmentPosition[3];
                */
                var spatial = /xywh=([^&]+)/g.exec(item.target);
                var temporal = /t=([^&]+)/g.exec(item.target);
                var xywh = void 0;
                if (spatial && spatial[1]) {
                    xywh = spatial[1].split(',');
                }
                else {
                    xywh = [0, 0, this._canvasWidth, this._canvasHeight];
                }
                var t = void 0;
                if (temporal && temporal[1]) {
                    t = temporal[1].split(',');
                }
                else {
                    t = [0, this._canvasClockDuration];
                }
                var positionLeft = parseInt(xywh[0]), positionTop = parseInt(xywh[1]), mediaWidth = parseInt(xywh[2]), mediaHeight = parseInt(xywh[3]), startTime = parseInt(t[0]), endTime = parseInt(t[1]);
                var percentageTop = this._convertToPercentage(positionTop, this._canvasHeight), percentageLeft = this._convertToPercentage(positionLeft, this._canvasWidth), percentageWidth = this._convertToPercentage(mediaWidth, this._canvasWidth), percentageHeight = this._convertToPercentage(mediaHeight, this._canvasHeight);
                var temporalOffsets = /t=([^&]+)/g.exec(item.body.id);
                var ot = void 0;
                if (temporalOffsets && temporalOffsets[1]) {
                    ot = temporalOffsets[1].split(',');
                }
                else {
                    ot = [null, null];
                }
                var offsetStart = (ot[0]) ? parseInt(ot[0]) : ot[0], offsetEnd = (ot[1]) ? parseInt(ot[1]) : ot[1];
                var itemData = {
                    'type': item.body.type,
                    'source': mediaSource,
                    'start': startTime,
                    'end': endTime,
                    'top': percentageTop,
                    'left': percentageLeft,
                    'width': percentageWidth,
                    'height': percentageHeight,
                    'startOffset': offsetStart,
                    'endOffset': offsetEnd,
                    'active': false
                };
                this._renderMediaElement(itemData);
            }
        };
        CanvasInstance.prototype.update = function (data) {
            if (data) {
                this._data = data;
            }
            if (this._isLimitedToRange() && this.currentDuration) {
                this._$canvasTimelineContainer.hide();
                this._$rangeTimelineContainer.show();
            }
            else {
                this._$canvasTimelineContainer.show();
                this._$rangeTimelineContainer.hide();
            }
            this._updateCurrentTimeDisplay();
            this._updateDurationDisplay();
        };
        CanvasInstance.prototype.destroy = function () {
            window.clearInterval(this._highPriorityInterval);
            window.clearInterval(this._lowPriorityInterval);
            window.clearInterval(this._canvasClockInterval);
        };
        CanvasInstance.prototype._convertToPercentage = function (pixelValue, maxValue) {
            var percentage = (pixelValue / maxValue) * 100;
            return percentage;
        };
        CanvasInstance.prototype._renderMediaElement = function (data) {
            var $mediaElement;
            switch (data.type.toLowerCase()) {
                case 'image':
                    $mediaElement = $('<img class="anno" src="' + data.source + '" />');
                    break;
                case 'video':
                    $mediaElement = $('<video class="anno" src="' + data.source + '" />');
                    break;
                case 'audio':
                    $mediaElement = $('<audio class="anno" src="' + data.source + '" />');
                    break;
                case 'textualbody':
                    $mediaElement = $('<div class="anno">' + data.source + '</div>');
                    break;
                default:
                    return;
            }
            $mediaElement.css({
                top: data.top + '%',
                left: data.left + '%',
                width: data.width + '%',
                height: data.height + '%'
            }).hide();
            data.element = $mediaElement;
            if (data.type.toLowerCase() === 'video' || data.type.toLowerCase() === 'audio') {
                data.timeout = null;
                var that_1 = this;
                data.checkForStall = function () {
                    var self = this;
                    if (this.active) {
                        that_1._checkMediaSynchronization();
                        if (this.element.get(0).readyState > 0 && !this.outOfSync) {
                            that_1._playbackStalled(false, self);
                        }
                        else {
                            that_1._playbackStalled(true, self);
                            if (this.timeout) {
                                window.clearTimeout(this.timeout);
                            }
                            this.timeout = window.setTimeout(function () {
                                self.checkForStall();
                            }, 1000);
                        }
                    }
                    else {
                        that_1._playbackStalled(false, self);
                    }
                };
            }
            this._contentAnnotations.push(data);
            if (this.$playerElement) {
                this._$canvasContainer.append($mediaElement);
            }
            if (data.type.toLowerCase() === 'video' || data.type.toLowerCase() === 'audio') {
                var that_2 = this;
                var self_1 = data;
                $mediaElement.on('loadstart', function () {
                    //console.log('loadstart');
                    self_1.checkForStall();
                });
                $mediaElement.on('waiting', function () {
                    //console.log('waiting');
                    self_1.checkForStall();
                });
                $mediaElement.on('seeking', function () {
                    //console.log('seeking');
                    //self.checkForStall();
                });
                $mediaElement.on('loadedmetadata', function () {
                    that_2._readyCanvasesCount++;
                    if (that_2._readyCanvasesCount === that_2._contentAnnotations.length) {
                        that_2.setCurrentTime(0);
                        if (that_2._data.autoPlay) {
                            that_2.play();
                        }
                        that_2._updateDurationDisplay();
                        that_2.fire(IIIFComponents.AVComponent.Events.CANVASREADY);
                    }
                });
                $mediaElement.attr('preload', 'auto');
                $mediaElement.get(0).load(); // todo: type
            }
            this._renderSyncIndicator(data);
        };
        CanvasInstance.prototype._updateCurrentTimeDisplay = function () {
            if (this._isLimitedToRange() && this.currentDuration) {
                var rangeClockTime = this._canvasClockTime - this.currentDuration.start;
                this._$canvasTime.text(IIIFComponents.AVComponentUtils.Utils.formatTime(rangeClockTime));
            }
            else {
                this._$canvasTime.text(IIIFComponents.AVComponentUtils.Utils.formatTime(this._canvasClockTime));
            }
        };
        CanvasInstance.prototype._updateDurationDisplay = function () {
            if (this._isLimitedToRange() && this.currentDuration) {
                this._$canvasDuration.text(IIIFComponents.AVComponentUtils.Utils.formatTime(this.currentDuration.getLength()));
            }
            else {
                this._$canvasDuration.text(IIIFComponents.AVComponentUtils.Utils.formatTime(this._canvasClockDuration));
            }
        };
        CanvasInstance.prototype.highlightDuration = function () {
            if (!this.currentDuration) {
                return;
            }
            // get the total length in seconds.
            var totalLength = this._canvasClockDuration;
            // get the length of the timeline container
            var timelineLength = this._$canvasTimelineContainer.width();
            // get the ratio of seconds to length
            var ratio = timelineLength / totalLength;
            var start = this.currentDuration.start * ratio;
            var end = this.currentDuration.end * ratio;
            var width = end - start;
            // set the start position and width
            this._$durationHighlight.css({
                left: start,
                width: width
            });
            var that = this;
            this._$rangeTimelineContainer.slider("destroy");
            this._$rangeTimelineContainer.slider({
                value: this.currentDuration.start,
                step: 0.01,
                orientation: "horizontal",
                range: "min",
                min: this.currentDuration.start,
                max: this.currentDuration.end,
                animate: false,
                create: function (evt, ui) {
                    // on create
                },
                slide: function (evt, ui) {
                    that.setCurrentTime(ui.value);
                },
                stop: function (evt, ui) {
                    //this.setCurrentTime(ui.value);
                }
            });
            this.update();
        };
        CanvasInstance.prototype.setVolume = function (value) {
            for (var i = 0; i < this._contentAnnotations.length; i++) {
                var $mediaElement = this._contentAnnotations[i];
                $($mediaElement.element).prop("volume", value);
            }
        };
        CanvasInstance.prototype._renderSyncIndicator = function (mediaElementData) {
            var leftPercent = this._convertToPercentage(mediaElementData.start, this._canvasClockDuration);
            var widthPercent = this._convertToPercentage(mediaElementData.end - mediaElementData.start, this._canvasClockDuration);
            var $timelineItem = $('<div class="timelineItem" title="' + mediaElementData.source + '" data-start="' + mediaElementData.start + '" data-end="' + mediaElementData.end + '"></div>');
            $timelineItem.css({
                left: leftPercent + '%',
                width: widthPercent + '%'
            });
            var $lineWrapper = $('<div class="lineWrapper"></div>');
            $timelineItem.appendTo($lineWrapper);
            mediaElementData.timelineElement = $timelineItem;
            if (this.$playerElement) {
                this._$timelineItemContainer.append($lineWrapper);
            }
        };
        CanvasInstance.prototype.setCurrentTime = function (seconds) {
            // const secondsAsFloat: number = parseFloat(seconds.toString());
            // if (isNaN(secondsAsFloat)) {
            //     return;
            // }
            this._canvasClockTime = seconds; //secondsAsFloat;
            this._canvasClockStartDate = Date.now() - (this._canvasClockTime * 1000);
            this.logMessage('SET CURRENT TIME to: ' + this._canvasClockTime + ' seconds.');
            this._canvasClockUpdater();
            this._highPriorityUpdater();
            this._lowPriorityUpdater();
            this._synchronizeMedia();
        };
        CanvasInstance.prototype.play = function (withoutUpdate) {
            if (this._isPlaying)
                return;
            if (this._isLimitedToRange() && this.currentDuration && this._canvasClockTime >= this.currentDuration.end) {
                this._canvasClockTime = this.currentDuration.start;
            }
            if (this._canvasClockTime === this._canvasClockDuration) {
                this._canvasClockTime = 0;
            }
            this._canvasClockStartDate = Date.now() - (this._canvasClockTime * 1000);
            var self = this;
            this._highPriorityInterval = window.setInterval(function () {
                self._highPriorityUpdater();
            }, this._highPriorityFrequency);
            this._lowPriorityInterval = window.setInterval(function () {
                self._lowPriorityUpdater();
            }, this._lowPriorityFrequency);
            this._canvasClockInterval = window.setInterval(function () {
                self._canvasClockUpdater();
            }, this._canvasClockFrequency);
            this._isPlaying = true;
            if (!withoutUpdate) {
                this._synchronizeMedia();
            }
            this._$playButton.removeClass('play');
            this._$playButton.addClass('pause');
            this._$playButton.text(this._data.content.pause);
            this.fire(IIIFComponents.AVComponent.Events.PLAYCANVAS);
            this.logMessage('PLAY canvas');
        };
        CanvasInstance.prototype.pause = function (withoutUpdate) {
            window.clearInterval(this._highPriorityInterval);
            window.clearInterval(this._lowPriorityInterval);
            window.clearInterval(this._canvasClockInterval);
            this._isPlaying = false;
            if (!withoutUpdate) {
                this._highPriorityUpdater();
                this._lowPriorityUpdater();
                this._synchronizeMedia();
            }
            this._$playButton.removeClass('pause');
            this._$playButton.addClass('play');
            this._$playButton.text(this._data.content.play);
            this.fire(IIIFComponents.AVComponent.Events.PAUSECANVAS);
            this.logMessage('PAUSE canvas');
        };
        CanvasInstance.prototype._isLimitedToRange = function () {
            return this._data.limitToRange;
        };
        CanvasInstance.prototype._canvasClockUpdater = function () {
            this._canvasClockTime = (Date.now() - this._canvasClockStartDate) / 1000;
            if (this._isLimitedToRange() && this.currentDuration && this._canvasClockTime >= this.currentDuration.end) {
                this.pause();
            }
            if (this._canvasClockTime >= this._canvasClockDuration) {
                this._canvasClockTime = this._canvasClockDuration;
                this.pause();
            }
        };
        CanvasInstance.prototype._highPriorityUpdater = function () {
            this._$rangeTimelineContainer.slider({
                value: this._canvasClockTime
            });
            this._$canvasTimelineContainer.slider({
                value: this._canvasClockTime
            });
            this._updateCurrentTimeDisplay();
            this._updateDurationDisplay();
        };
        CanvasInstance.prototype._lowPriorityUpdater = function () {
            this._updateMediaActiveStates();
        };
        CanvasInstance.prototype._updateMediaActiveStates = function () {
            var contentAnnotation;
            for (var i = 0; i < this._contentAnnotations.length; i++) {
                contentAnnotation = this._contentAnnotations[i];
                if (contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime) {
                    this._checkMediaSynchronization();
                    if (!contentAnnotation.active) {
                        this._synchronizeMedia();
                        contentAnnotation.active = true;
                        contentAnnotation.element.show();
                        contentAnnotation.timelineElement.addClass('active');
                    }
                    if (contentAnnotation.type == 'Video' || contentAnnotation.type == 'Audio') {
                        if (contentAnnotation.element[0].currentTime > contentAnnotation.element[0].duration - contentAnnotation.endOffset) {
                            contentAnnotation.element[0].pause();
                        }
                    }
                }
                else {
                    if (contentAnnotation.active) {
                        contentAnnotation.active = false;
                        contentAnnotation.element.hide();
                        contentAnnotation.timelineElement.removeClass('active');
                        if (contentAnnotation.type == 'Video' || contentAnnotation.type == 'Audio') {
                            contentAnnotation.element[0].pause();
                        }
                    }
                }
            }
            //this.logMessage('UPDATE MEDIA ACTIVE STATES at: '+ this._canvasClockTime + ' seconds.');
        };
        CanvasInstance.prototype._synchronizeMedia = function () {
            var contentAnnotation;
            for (var i = 0; i < this._contentAnnotations.length; i++) {
                contentAnnotation = this._contentAnnotations[i];
                if (contentAnnotation.type.toLowerCase() === 'video' || contentAnnotation.type.toLowerCase() === 'audio') {
                    contentAnnotation.element[0].currentTime = this._canvasClockTime - contentAnnotation.start + contentAnnotation.startOffset;
                    if (contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime) {
                        if (this._isPlaying) {
                            if (contentAnnotation.element[0].paused) {
                                var promise = contentAnnotation.element[0].play();
                                if (promise) {
                                    promise["catch"](function () { });
                                }
                            }
                        }
                        else {
                            contentAnnotation.element[0].pause();
                        }
                    }
                    else {
                        contentAnnotation.element[0].pause();
                    }
                    if (contentAnnotation.element[0].currentTime > contentAnnotation.element[0].duration - contentAnnotation.endOffset) {
                        contentAnnotation.element[0].pause();
                    }
                }
            }
            this.logMessage('SYNC MEDIA at: ' + this._canvasClockTime + ' seconds.');
        };
        CanvasInstance.prototype._checkMediaSynchronization = function () {
            var contentAnnotation;
            for (var i = 0, l = this._contentAnnotations.length; i < l; i++) {
                contentAnnotation = this._contentAnnotations[i];
                if ((contentAnnotation.type.toLowerCase() === 'video' || contentAnnotation.type.toLowerCase() === 'audio') &&
                    (contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime)) {
                    var correctTime = (this._canvasClockTime - contentAnnotation.start + contentAnnotation.startOffset);
                    var factualTime = contentAnnotation.element[0].currentTime;
                    // off by 0.2 seconds
                    if (Math.abs(factualTime - correctTime) > 0.4) {
                        contentAnnotation.outOfSync = true;
                        //this.playbackStalled(true, contentAnnotation);
                        var lag = Math.abs(factualTime - correctTime);
                        this.logMessage('DETECTED synchronization lag: ' + Math.abs(lag));
                        contentAnnotation.element[0].currentTime = correctTime;
                        //this.synchronizeMedia();
                    }
                    else {
                        contentAnnotation.outOfSync = false;
                        //this.playbackStalled(false, contentAnnotation);
                    }
                }
            }
        };
        CanvasInstance.prototype._playbackStalled = function (aBoolean, syncMediaRequestingStall) {
            if (aBoolean) {
                if (this._stallRequestedBy.indexOf(syncMediaRequestingStall) < 0) {
                    this._stallRequestedBy.push(syncMediaRequestingStall);
                }
                if (!this._isStalled) {
                    if (this.$playerElement) {
                        this._showWorkingIndicator(this._$canvasContainer);
                    }
                    this._wasPlaying = this._isPlaying;
                    this.pause(true);
                    this._isStalled = aBoolean;
                }
            }
            else {
                var idx = this._stallRequestedBy.indexOf(syncMediaRequestingStall);
                if (idx >= 0) {
                    this._stallRequestedBy.splice(idx, 1);
                }
                if (this._stallRequestedBy.length === 0) {
                    this._hideWorkingIndicator();
                    if (this._isStalled && this._wasPlaying) {
                        this.play(true);
                    }
                    this._isStalled = aBoolean;
                }
            }
        };
        CanvasInstance.prototype._showWorkingIndicator = function ($targetElement) {
            var workingIndicator = $('<div class="workingIndicator">Waiting...</div>');
            if ($targetElement.find('.workingIndicator').length == 0) {
                $targetElement.append(workingIndicator);
            }
            //console.log('show working');
        };
        CanvasInstance.prototype._hideWorkingIndicator = function () {
            $('.workingIndicator').remove();
            //console.log('hide working');
        };
        CanvasInstance.prototype.resize = function () {
            if (this.$playerElement) {
                var containerWidth = this._$canvasContainer.width();
                if (containerWidth) {
                    this._$canvasTimelineContainer.width(containerWidth);
                    //const resizeFactorY: number = containerWidth / this.canvasWidth;
                    //$canvasContainer.height(this.canvasHeight * resizeFactorY);
                    var $options = this.$playerElement.find('.optionsContainer');
                    this._$canvasContainer.height(this.$playerElement.parent().height() - $options.height());
                }
                this.highlightDuration();
            }
        };
        CanvasInstance.prototype.on = function (name, callback, ctx) {
            var e = this._e || (this._e = {});
            (e[name] || (e[name] = [])).push({
                fn: callback,
                ctx: ctx
            });
        };
        CanvasInstance.prototype.fire = function (name) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var data = [].slice.call(arguments, 1);
            var evtArr = ((this._e || (this._e = {}))[name] || []).slice();
            var i = 0;
            var len = evtArr.length;
            for (i; i < len; i++) {
                evtArr[i].fn.apply(evtArr[i].ctx, data);
            }
        };
        return CanvasInstance;
    }());
    IIIFComponents.CanvasInstance = CanvasInstance;
})(IIIFComponents || (IIIFComponents = {}));

var IIIFComponents;
(function (IIIFComponents) {
    var AVComponentObjects;
    (function (AVComponentObjects) {
        var Duration = /** @class */ (function () {
            function Duration(start, end) {
                this.start = start;
                this.end = end;
            }
            Duration.prototype.getLength = function () {
                return this.end - this.start;
            };
            return Duration;
        }());
        AVComponentObjects.Duration = Duration;
    })(AVComponentObjects = IIIFComponents.AVComponentObjects || (IIIFComponents.AVComponentObjects = {}));
})(IIIFComponents || (IIIFComponents = {}));



var IIIFComponents;
(function (IIIFComponents) {
    var AVComponentUtils;
    (function (AVComponentUtils) {
        var Utils = /** @class */ (function () {
            function Utils() {
            }
            Utils.formatTime = function (aNumber) {
                var hours, minutes, seconds, hourValue;
                seconds = Math.ceil(aNumber);
                hours = Math.floor(seconds / (60 * 60));
                hours = (hours >= 10) ? hours : '0' + hours;
                minutes = Math.floor(seconds % (60 * 60) / 60);
                minutes = (minutes >= 10) ? minutes : '0' + minutes;
                seconds = Math.floor(seconds % (60 * 60) % 60);
                seconds = (seconds >= 10) ? seconds : '0' + seconds;
                if (hours >= 1) {
                    hourValue = hours + ':';
                }
                else {
                    hourValue = '';
                }
                return hourValue + minutes + ':' + seconds;
            };
            return Utils;
        }());
        AVComponentUtils.Utils = Utils;
    })(AVComponentUtils = IIIFComponents.AVComponentUtils || (IIIFComponents.AVComponentUtils = {}));
})(IIIFComponents || (IIIFComponents = {}));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});