(function (win, $) {
    "use strict";
    $(function () {
        function ViewerBox() {
            var viewer = {},
                imageTmpl = $('<img alt="" src="" />'),
                videoTmpl = $('<video src="" controls></video>'),
                iframeTmpl = $('<div></div>', {'class': 'flex-video widescreen vimeo'}),
                buttonTmpl = '<button></button>',
                keys = {
                    "27": "Escape",
                    "37": "ArrowLeft",
                    "39": "ArrowRight"
                };

            viewer.config = {
                box: '<div class="viewBox"><a href="#" class="close">&times;</a><div class="viewWindow"></div><div class="viewOverlay"></div></div>',
                links: '[data-viewbox]',
                view: '.viewWindow',
                overlay: '.viewOverlay',
                close: '.close',
                viewAnim: 400,
                overlayAnim: 600,
                opacity: 0.8
            };

            viewer.gallery = {
                view: '',
                index: -1,
                items: []
            };

            viewer.init = function () {
                var active = $(viewer.config.links),
                    box,
                    overlay,
                    view,
                    prev,
                    next,
                    anim,
                    close;

                if (active.length > 0) {
                    box = $(viewer.config.box);
                    overlay = box.find(viewer.config.overlay);
                    view = box.find(viewer.config.view);
                    close = box.find(viewer.config.close);
                    prev = $(buttonTmpl, {'class': 'prev'});
                    next = $(buttonTmpl, {'class': 'next'});
                    anim = box.find(viewer.config.view + ', ' + viewer.config.close);

                    active.on('click.viewer.open', function (e) {
                        e.preventDefault();
                        var link = $(e.currentTarget);
                        viewer.open(link, view, anim, overlay, box);
                    });

                    prev.on('click.viewer.prev', function(e){
                        e.preventDefault();
                        if (viewer.gallery.view) {
                            viewer.galleryPrev(view);
                        }
                    });

                    next.on('click.viewer.next', function(e){
                        e.preventDefault();
                        if (viewer.gallery.view) {
                            viewer.galleryNext(view);
                        }
                    });

                    view.on('viewer.open', function(){
                        overlay.fadeTo(viewer.config.overlayAnim, viewer.config.opacity);
                        anim.fadeTo(viewer.config.viewAnim, 1);
                    });

                    box.append(prev)
                        .append(next);

                    view.on('gallery.open', function(){
                        prev.fadeTo(viewer.config.viewAnim, 1);
                        next.fadeTo(viewer.config.viewAnim, 1);
                    });
                    view.on('gallery.close', function(){
                        prev.fadeOut(viewer.config.viewAnim);
                        next.fadeOut(viewer.config.viewAnim);
                    });

                    $('body').append(box);
                    $(win).on('keyup', function(e){
                        e.preventDefault();
                        viewer.galleryKey(e, view, anim, overlay);
                    });
                }
            };

            viewer.find = function (collection, key, last) {
                var result = [];
                collection.forEach(function(item, index){
                    if ( item.data === key ) {
                        result.push(index);
                    }
                });
                return (!last) ? result[0] : result[result.length - 1];
            };

            viewer.parseKey = function (e) {
                var result;
                if (e.key !== undefined) {
                    result = e.key;
                } else {
                    result = keys[e.keyCode];
                }
                return result;
            };

            viewer.open = function (link, view, anim, overlay, box) {
                var type = link.attr('data-viewbox'),
                    data,
                    gallery = link.attr('data-gallery');

                switch (type) {
                    case "video":
                        data = link.attr('href');
                        viewer.videoLoad(data, view, type, gallery);
                        break;
                    case "iframe":
                        data = link.attr('data-iframe');
                        viewer.iframeLoad(data, view, type, gallery);
                        break;
                    case "image":
                        data = link.attr('href');
                        viewer.imageLoad(data, view, type, gallery);
                        break;
                    default:
                        data = link.attr('href');
                        viewer.load(data, view, "text");
                }
                box.one('click.viewer.close', viewer.config.close + ', ' + viewer.config.overlay, function (e) {
                    e.preventDefault();
                    viewer.close(view, anim, overlay);
                });
                view.trigger('viewer.open');
            };

            viewer.load = function (data, view, type) {
                var text = $(data).clone();

                view.removeClass('video image iframe')
                    .addClass(type)
                    .append(text);
            };

            viewer.imageLoad = function (data, view, type, gallery) {
                var image = imageTmpl.attr('src', data);

                view.removeClass('video text iframe')
                    .addClass(type)
                    .append(image);
                if (gallery) {
                    viewer.galleryInit(gallery, data, type, view);
                }
                image.one('load', function(){
                    view.fadeTo('fast', 1)
                        .trigger('image.load');
                });
            };

            viewer.videoLoad = function (data, view, type, gallery) {
                var video;

                video = ( videoTmpl.attr('src') !== data ) ? videoTmpl.attr('src', data) : videoTmpl;
                view.removeClass('image text iframe')
                    .addClass(type)
                    .append(video)
                    .fadeTo('fast', 1);
                video[0].play();
                view.trigger('video.load');
                if (gallery) {
                    viewer.galleryInit(gallery, data, type, view);
                }
            };

            viewer.iframeLoad = function (data, view, type, gallery) {
                var iframe = iframeTmpl.clone().append(data);

                view.removeClass('video text image')
                    .addClass(type)
                    .append(iframe);

                if (gallery) {
                    viewer.galleryInit(gallery, data, type, view);
                }
                view.fadeTo('fast', 1)
                    .trigger('iframe.load');
            };

            viewer.galleryInit = function (gallery, image, type, view) {
                var images = $('[data-gallery="' + gallery + '"]').map(function (ignore, el) {
                        var itemType = el.getAttribute('data-viewbox');
                        return {data: (itemType === "iframe") ? el.getAttribute('data-iframe') : el.getAttribute('href'), type: itemType};
                    }).get(),
                    currentIndex = viewer.find(images, image);

                if (currentIndex !== -1) {
                    viewer.gallery.view = gallery;
                    viewer.gallery.items = images;
                    viewer.gallery.index = currentIndex;

                    view.trigger('gallery.open');
                }
            };

            viewer.galleryOpen = function (data, view, type) {
                switch (type) {
                    case 'video':
                        viewer.videoLoad(data, view, type);
                        break;
                    case 'iframe':
                        viewer.iframeLoad(data, view, type);
                        break;
                    case 'image':
                        viewer.imageLoad(data, view, type);
                        break;
                }
            };

            viewer.galleryPrev = function (view) {
                var cur;
                viewer.gallery.index -= 1;
                if (viewer.gallery.index === -1) {
                    viewer.gallery.index = viewer.gallery.items.length - 1;
                }
                cur = viewer.gallery.items[viewer.gallery.index];
                view.fadeTo('fast', 0, function(){
                    view.empty();
                    viewer.galleryOpen(cur.data, view, cur.type);
                });
                view.trigger('gallery.prev');
            };

            viewer.galleryNext = function (view) {
                var cur;
                viewer.gallery.index += 1;
                if (viewer.gallery.index === viewer.gallery.items.length) {
                    viewer.gallery.index = 0;
                }
                cur = viewer.gallery.items[viewer.gallery.index];
                view.fadeTo('fast', 0, function(){
                    view.empty();
                    viewer.galleryOpen(cur.data, view, cur.type);
                });
                view.trigger('gallery.next');
            };

            viewer.galleryKey = function (e, view, anim, overlay) {
                if (viewer.gallery.view) {
                    switch (viewer.parseKey(e)) {
                        case 'ArrowLeft':
                            viewer.galleryPrev(view);
                            break;
                        case 'ArrowRight':
                            viewer.galleryNext(view);
                            break;
                        case 'Escape':
                            viewer.close(view, anim, overlay);
                            break;
                    }
                }
            };

            viewer.close = function (view, anim, overlay) {
                var vid;
                viewer.gallery.view = '';
                anim.fadeOut(viewer.config.viewAnim, function () {
                    if (view.hasClass('video')) {
                        vid = view.find('video');
                        if (vid.length > 0) {
                            videoTmpl = vid.detach();
                            videoTmpl[0].pause();
                        }
                    }
                    view.empty();
                    view.trigger('gallery.close');
                });
                overlay.fadeOut(viewer.config.overlayAnim);
            };

            return viewer;
        }

        win.viewerbox = new ViewerBox();

        win.viewerbox.init();
    });
}(window, jQuery));
