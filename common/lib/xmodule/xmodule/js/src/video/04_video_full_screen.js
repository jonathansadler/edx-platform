(function(define) {
    'use strict';
    define('video/04_video_full_screen.js', ['edx-ui-toolkit/js/utils/html-utils'], function(HtmlUtils) {
        var template = [
            '<button class="control add-fullscreen" aria-disabled="false" title="',
            gettext('Fill browser'),
            '" aria-label="',
            gettext('Fill browser'),
            '">',
            '<span class="icon fa fa-arrows-alt" aria-hidden="true"></span>',
            '</button>'
        ].join('');

    // The following properties and functions enable cross-browser use of the
    // the Fullscreen Web API.
    //
    //     function _getVendorPrefixed(property)
    //     function _getFullscreenElement()
    //     function _exitFullscreen()
    //     function _requestFullscreen(element, options)
    //
    //     For more information about the Fullscreen Web API see MDN:
    //     https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
    //     way - you don't have to do repeated jQuery element selects.
        var prefixedFullscreenProperties = (()=> {
            if ('fullscreenEnabled' in document) {
                return {
                    fullscreenElement: 'fullscreenElement',
                    fullscreenEnabled: 'fullscreenEnabled',
                    requestFullscreen: 'requestFullscreen',
                    exitFullscreen: 'exitFullscreen',
                    fullscreenchange: 'fullscreenchange',
                    fullscreenerror: 'fullscreenerror',
                };
            }
            if ('webkitFullscreenEnabled' in document) {
                return {
                    fullscreenElement: 'webkitFullscreenElement',
                    fullscreenEnabled: 'webkitFullscreenEnabled',
                    requestFullscreen: 'webkitRequestFullscreen',
                    exitFullscreen: 'webkitExitFullscreen',
                    fullscreenchange: 'webkitfullscreenchange',
                    fullscreenerror: 'webkitfullscreenerror',
                };
            }
            if ('mozFullScreenEnabled' in document) {
                return {
                    fullscreenElement: 'mozFullScreenElement',
                    fullscreenEnabled: 'mozFullScreenEnabled',
                    requestFullscreen: 'mozRequestFullScreen',
                    exitFullscreen: 'mozCancelFullScreen',
                    fullscreenchange: 'mozfullscreenchange',
                    fullscreenerror: 'mozfullscreenerror',
                };
            }
            if ('msFullscreenEnabled' in document) {
                return {
                    fullscreenElement: 'msFullscreenElement',
                    fullscreenEnabled: 'msFullscreenEnabled',
                    requestFullscreen: 'msRequestFullscreen',
                    exitFullscreen: 'msExitFullscreen',
                    fullscreenchange: 'MSFullscreenChange',
                    fullscreenerror: 'MSFullscreenError',
                };
            }
            return {};
        })();

        function _getVendorPrefixed(property) {
            return prefixedFullscreenProperties[property];
        }

        function _getFullscreenElement() {
            return document[_getVendorPrefixed('fullscreenElement')];
        }

        function _exitFullscreen() {
            if (document[_getVendorPrefixed('exitFullscreen')]) {
                return document[_getVendorPrefixed('exitFullscreen')]();
            }
        }

        function _requestFullscreen(element, options) {
            if (element[_getVendorPrefixed('requestFullscreen')]) {
                return element[_getVendorPrefixed('requestFullscreen')](options);
            }
        }

    // VideoControl() function - what this module "exports".
        return function(state) {
            var dfd = $.Deferred();

            state.videoFullScreen = {};

            _makeFunctionsPublic(state);
            _renderElements(state);
            _bindHandlers(state);

            dfd.resolve();
            return dfd.promise();
        };

    // ***************************************************************
    // Private functions start here.
    // ***************************************************************

    // function _makeFunctionsPublic(state)
    //
    //     Functions which will be accessible via 'state' object. When called, these functions will
    //     get the 'state' object as a context.
        function _makeFunctionsPublic(state) {
            var methodsDict = {
                destroy: destroy,
                enter: enter,
                exit: exit,
                exitHandler: exitHandler,
                handleExit: handleExit,
                handleEnter: handleEnter,
                handleFullscreenChange: handleFullscreenChange,
                toggle: toggle,
                toggleHandler: toggleHandler,
                updateControlsHeight: updateControlsHeight
            };

            state.bindTo(methodsDict, state.videoFullScreen, state);
        }

        function destroy() {
            $(document).off('keyup', this.videoFullScreen.exitHandler);
            this.videoFullScreen.fullScreenEl.remove();
            this.el.off({
                destroy: this.videoFullScreen.destroy
            });
            document.removeEventListener(
                _getVendorPrefixed('fullscreenchange'),
                this.videoFullScreen.handleFullscreenChange,
            );
            if (this.isFullScreen) {
                this.videoFullScreen.exit();
            }
            delete this.videoFullScreen;
        }

    // function _renderElements(state)
    //
    //     Create any necessary DOM elements, attach them, and set their initial configuration. Also
    //     make the created DOM elements available via the 'state' object. Much easier to work this
    //     way - you don't have to do repeated jQuery element selects.
        function _renderElements(state) {
            state.videoFullScreen.fullScreenEl = $(template);
            state.videoFullScreen.sliderEl = state.el.find('.slider');
            state.videoFullScreen.fullScreenState = false;
            HtmlUtils.append(state.el.find('.secondary-controls'), HtmlUtils.HTML(state.videoFullScreen.fullScreenEl));
            state.videoFullScreen.updateControlsHeight();
        }

    // function _bindHandlers(state)
    //
    //     Bind any necessary function callbacks to DOM events (click, mousemove, etc.).
        function _bindHandlers(state) {
            state.videoFullScreen.fullScreenEl.on('click', state.videoFullScreen.toggleHandler);
            state.el.on({
                destroy: state.videoFullScreen.destroy
            });
            $(document).on('keyup', state.videoFullScreen.exitHandler);
            document.addEventListener(
                _getVendorPrefixed('fullscreenchange'),
                state.videoFullScreen.handleFullscreenChange,
            );
        }

        function _getControlsHeight(controls, slider) {
            return controls.height() + 0.5 * slider.height();
        }

    // ***************************************************************
    // Public functions start here.
    // These are available via the 'state' object. Their context ('this' keyword) is the 'state' object.
    // The magic private function that makes them available and sets up their context is makeFunctionsPublic().
    // ***************************************************************

        function handleFullscreenChange() {
            if (_getFullscreenElement() !== this.el[0] && this.isFullScreen) {
                // The video was fullscreen so this event must relate to this video
                this.videoFullScreen.handleExit();
            }
        }

        function updateControlsHeight() {
            var controls = this.el.find('.video-controls'),
                slider = this.videoFullScreen.sliderEl;
            this.videoFullScreen.height = _getControlsHeight(controls, slider);
            return this.videoFullScreen.height;
        }

    /**
     * Event handler to toggle fullscreen mode.
     * @param {jquery Event} event
     */
        function toggleHandler(event) {
            event.preventDefault();
            this.videoCommands.execute('toggleFullScreen');
        }

        function handleExit() {
            if (this.isFullScreen === false) {
                return;
            }
            var fullScreenClassNameEl = this.el.add(document.documentElement),
                closedCaptionsEl = this.el.find('.closed-captions');

            this.videoFullScreen.fullScreenState = this.isFullScreen = false;
            fullScreenClassNameEl.removeClass('video-fullscreen');
            $(window).scrollTop(this.scrollPos);
            this.videoFullScreen.fullScreenEl
            .attr({title: gettext('Fill browser'), 'aria-label': gettext('Fill browser')})
            .find('.icon')
                .removeClass('fa-compress')
                .addClass('fa-arrows-alt');

            $(closedCaptionsEl).css({ top: '70%', left: '5%' });

            this.resizer.delta.reset().setMode('width');
        }

        function handleEnter() {
            if (this.isFullScreen === true) {
                return;
            }
            var fullScreenClassNameEl = this.el.add(document.documentElement),
                closedCaptionsEl = this.el.find('.closed-captions');

            this.videoFullScreen.fullScreenState = this.isFullScreen = true;
            fullScreenClassNameEl.addClass('video-fullscreen');
            this.videoFullScreen.fullScreenEl
            .attr({title: gettext('Exit full browser'), 'aria-label': gettext('Exit full browser')})
            .find('.icon')
                .removeClass('fa-arrows-alt')
                .addClass('fa-compress');

            $(closedCaptionsEl).css({ top: '70%', left: '5%' });

            var height = this.videoFullScreen.updateControlsHeight();
            this.resizer.delta.substract(height, 'height').setMode('both');
        }

        function exit() {
            if (_getFullscreenElement() === this.el[0]) {
                _exitFullscreen();
            }
            this.videoFullScreen.handleExit();
        }

        function enter() {
            this.scrollPos = $(window).scrollTop();
            _requestFullscreen(this.el[0]);
            this.videoFullScreen.handleEnter();
        }

    /** Toggle fullscreen mode. */
        function toggle() {
            if (this.videoFullScreen.fullScreenState) {
                this.videoFullScreen.exit();
            } else {
                this.videoFullScreen.enter();
            }
        }

    /**
     * Event handler to exit from fullscreen mode.
     * @param {jquery Event} event
     */
        function exitHandler(event) {
            if ((this.isFullScreen) && (event.keyCode === 27)) {
                event.preventDefault();
                this.videoCommands.execute('toggleFullScreen');
            }
        }
    });
}(RequireJS.define));
