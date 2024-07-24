window.onload = function () {
    setInterval("toggleSound()", 100);
}

function toggleSound() {
    var music = document.getElementById("music");//获取ID  

    if (music.paused) { //判读是否播放  
        music.paused = false;
        music.play(); //没有就播放（伪自动）
    }
}