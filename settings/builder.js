$(document).on("builder-loaded", function (e) {
    onBuilderLoaded();
    console.log("Builder loaded");
});

$(document).ready(function () {
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
        $(this).toggleClass('active');
    });

    $(".custom-file-input").on("change", function() {
        var fileName = $(this).val().split("\\").pop();
        $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
      });
});

function addEntry(text) {
    $(".content").append($("<pre></pre>").text(text));
}

(function injectAssets() {
    var IS_TESLA = Boolean(navigator.userAgent.match(/\bTesla\b/));
    var ASK_DIST = Boolean(window.location.search.match(/\busedist\b/));
    var USE_DIST = ASK_DIST || IS_TESLA;
    function injectAsset(src) {
        var d = document.createElement("script");
        d.setAttribute("type", "text/javascript");
        d.setAttribute("src", src);
        document.head.appendChild(d);
    }
    injectAsset("../twitch-api/" + (USE_DIST ? "dist/" : "") + "utility.js");
})();

const app = new Vue({
    el: '#app',
    data: {
        display: 'redbox'
    }
})