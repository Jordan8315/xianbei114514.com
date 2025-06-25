window.onload = function () {
    // 优化：直接传入函数引用
    setInterval(toggleSound, 100);
}

function toggleSound() {
    var music = document.getElementById("music");
    if (music.paused) {
        // 直接调用 play 方法，不需要修改 paused 属性
        music.play(); 
    }
}