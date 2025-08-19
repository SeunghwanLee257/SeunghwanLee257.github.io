window.addEventListener('scroll', function() {
  const boxes = document.querySelectorAll('.box'); // 모든 .box 요소 선택
  boxes.forEach(function(box) {
    const boxPosition = box.getBoundingClientRect().top; // 각 박스의 위치 계산
    const windowHeight = window.innerHeight;

    // 박스가 뷰포트에 도달하면 expand 클래스 추가
    if (boxPosition <= windowHeight && boxPosition >= 0) {
      box.classList.add('expand');
    } else {
      box.classList.remove('expand');
    }
  });
});
