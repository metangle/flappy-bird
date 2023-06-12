const bird = {
  // 添加这些属性到对象中，减少对dom的请求
  // 例如要对 sky背景的background-position-x修改，不必每次都对dom元素操作取值
  skyPosition: 0,
  skyStep: 2, // 控制天空背景移动的速度 2为初始未开始的速度
  birdTop: 235, // bird 元素初始的高度位置
  startColor: "white",
  startFlag: false, // 判断游戏是否开始，初始未开始时是 false
  birdStepY: 0, // 小鸟 加速 降落事件中的初始步长
  minTop: 0, // 小鸟活动范围的边界（上界）
  maxTop: 570, // 小鸟活动范围的边界（下界） 600 - 30
  timer: null,
  pipeLength: 7, // 想生成的柱子的个数
  pipeArr: [],
  pipeLastIndex: 6, // 最后一根柱子的索引
  score: 0,

  init() {
    this.initData();
    this.animate();
    this.handleStart();
    this.handleClick();
    this.handleReStart();

    if (getSession("play")) {
      this.start();
    }
  },

  // 初始化函数
  initData() {
    // 使用this 使得bird内的成员均可以使用下面的属性
    this.el = document.getElementById("game");
    this.oBird = this.el.getElementsByClassName("bird")[0];
    this.oStart = this.el.getElementsByClassName("start")[0];
    this.oScore = this.el.getElementsByClassName("score")[0];
    this.oMask = this.el.getElementsByClassName("mask")[0];
    this.oEnd = this.el.getElementsByClassName("end")[0];
    this.oFinalScore = this.oEnd.getElementsByClassName("final-score")[0];
    this.oReStart = this.el.getElementsByClassName("restart")[0];

  },

  // 运动函数
  animate() {
    // 减少整个JS文件中定时器的使用次数，将skyMove birdJump等事件放入animate 函数的定时器中一同运动
    const self = this;
    let count = 0;
    this.timer = setInterval(function () {
      self.skyMove();
      // 游戏开始
      if (self.startFlag) {
        self.birdDrop();
        self.pipeMove();
      }
      if (++count % 10 === 0) {
        // 游戏未开始
        if (!self.startFlag) {
          self.birdJump();
        }
        self.birdFly(count);
      }
    }, 30);
  },

  // 天空背景运动函数
  skyMove() {
    this.skyPosition -= this.skyStep;
    this.el.style.backgroundPositionX = this.skyPosition + "px";
  },

  // 开始之前小鸟的跳动（上下跳动）
  birdJump() {
    this.birdTop = this.birdTop === 220 ? 260 : 220;
    this.oBird.style.top = this.birdTop + "px";
  },

  // 小鸟扇动翅膀 小鸟fly
  birdFly: function (count) {
    this.oBird.style.backgroundPositionX = (count % 3) * -30 + "px";
  },

  // 开始游戏之后，不点击鼠标事件，小鸟自由落下(加速降落)
  birdDrop() {
    this.birdTop += ++this.birdStepY;
    this.oBird.style.top = this.birdTop + "px";
    this.judgeKnoke();
    this.addScore();
  },

  // 分数累加
  addScore() {
    const index = this.score % this.pipeLength;
    const pipeX = this.pipeArr[index].up.offsetLeft;
    if (pipeX < 13) {
      // 13 柱子正好越过小鸟的距离
      this.oScore.innerText = ++this.score;
    }
  },

  // 判断是否撞天 or 地 or 柱子
  judgeKnoke() {
    // 判断是否撞到边界
    this.judgeBoundary();
    // 判断是否撞到柱子
    this.judgePipe();
  },

  // 判断 撞到边界的函数
  judgeBoundary() {
    if (this.birdTop <= this.minTop || this.birdTop >= this.maxTop) {
      this.failGame();
    }
  },

  // 判断 是否撞到柱子 
  judgePipe() {
    // 柱子数组下标索引
    const index = this.score % this.pipeLength;
    const pipeX = this.pipeArr[index].up.offsetLeft;
    const pipeY = this.pipeArr[index].y; // []
    const birdY = this.birdTop;

    if (
      pipeX <= 95 &&
      pipeX >= 13 &&
      (birdY <= pipeY[0] || birdY >= pipeY[1])
    ) {
      this.failGame();
    }
  },

  // 生成柱子
  createPipe(x) {
    // 上下柱子之间的距离相等 150 px
    // 所以上下柱子的长度最合理的范围是 （600 - 150）/2 = 225
    // 控制范围在50~175

    const upHeight = 50 + Math.floor(Math.random() * 175);
    const downHeight = 450 - upHeight;
    // createEle函数存放在函数工具库 utils.js 中
    const oUpPipe = createEle("div", ["pipe", "pipe-up"], {
      left: x + "px",
      height: upHeight + "px",
    });

    const oDownPipe = createEle("div", ["pipe", "pipe-down"], {
      height: downHeight + "px",
      left: x + "px",
    });

    this.el.appendChild(oUpPipe);
    this.el.appendChild(oDownPipe);

    // 将柱子放在pipe函数中，方便后序的读取
    this.pipeArr.push({
      up: oUpPipe,
      down: oDownPipe,
      y: [upHeight, upHeight + 150 - 30], // 小鸟过柱子上下运动的安全距离
    });
  },

  // 柱子移动函数
  pipeMove() {
    for (let i = 0; i < this.pipeLength; i++) {
      const oUpPipe = this.pipeArr[i].up;
      const oDownPipe = this.pipeArr[i].down;
      // 使得 柱子和背景的运动速度一样
      const x = oUpPipe.offsetLeft - this.skyStep;

      if (x < -52) {
        // clearInterval(this.timer);
        const lastPipeLeft = this.pipeArr[this.pipeLastIndex].up.offsetLeft;
        oUpPipe.style.left = lastPipeLeft + 300 + "px";
        oDownPipe.style.left = lastPipeLeft + 300 + "px";
        // 改变最后一个柱子的索引值，将柱子可以连续移动
        this.pipeLastIndex = i;
        continue;
      }
      oUpPipe.style.left = x + "px";
      oDownPipe.style.left = x + "px";
    }
  },

  // 监听 Start 的事件函数
  handleStart() {
    this.oStart.onclick = this.start.bind(this);
  },
  start() {
    const self = this;
    self.oScore.style.display = "block";
    self.oStart.style.display = "none";
    self.skyStep = 5;
    // 点击游戏开始，游戏上锁
    self.startFlag = true;

    self.oBird.style.left = "80px";
    // 让小鸟元素 更改top值时候的 过渡效果取消
    self.oBird.style.transition = "none";

    for (let i = 1; i <= self.pipeLength; i++) {
      self.createPipe(300 * i);
    }
  },
  // 监听父元素 被点击的事件 控制小鸟往上飞
  handleClick() {
    const self = this;
    this.el.onclick = function (e) {
        const dom = e.target;
      // 事件委托，当事件源对象为 start‘开始游戏’时候，小鸟不往上飞10px
      const isStart = dom.classList.contains("start");
      if (!isStart) {
        self.birdStepY = -10;
      }
    };
  },

  // 重新开始点击事件
  handleReStart() {
    this.oReStart.onclick = function () {
      window.location.reload();
    };
  },

  // 游戏结束函数
  failGame() {
    clearInterval(this.timer);
    this.oMask.style.display = "block";
    this.oEnd.style.display = "block";
    this.oScore.style.display = "none";
    this.oBird.style.display = "none";
    this.oFinalScore.innerText = this.score;
  },
};
bird.init();
