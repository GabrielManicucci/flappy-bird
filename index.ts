const main_div = document.getElementById("content");
const startMenu = document.getElementById("startMenu");
const startButton = document.getElementById("startButton");

function createNewElement(tagName: string, className: string) {
  const element = document.createElement(tagName);
  element.classList.add(className);
  return element;
}

class Barrier {
  element: HTMLDivElement;
  setBodyHeight: (height: number) => void;

  constructor(reverse: boolean) {
    this.element = document.createElement("div");
    this.element.classList.add("barrier");

    const body = createNewElement("div", "body");
    const border = createNewElement("div", "border");

    this.element.appendChild(reverse ? body : border);
    this.element.appendChild(reverse ? border : body);

    this.setBodyHeight = (height: number) =>
      (body.style.height = `${height}px`);
  }
}

class BarrierPair {
  element: HTMLDivElement;
  supBarrier: Barrier;
  infBarrier: Barrier;
  randomGap: () => void;
  setX: (x: number) => void;
  getX: () => number;
  getWidth: () => number;

  constructor(x: number, height: number, gap: number) {
    this.element = document.createElement("div");
    this.element.classList.add("barrierPair");
    this.supBarrier = new Barrier(true);
    this.infBarrier = new Barrier(false);

    this.element.appendChild(this.supBarrier.element);
    this.element.appendChild(this.infBarrier.element);

    this.randomGap = () => {
      const supBarrierHeight = (height - gap) * Math.random();
      const infBarrierHeight = height - gap - supBarrierHeight;

      this.supBarrier.setBodyHeight(supBarrierHeight);
      this.infBarrier.setBodyHeight(infBarrierHeight);
    };

    this.setX = (x) => (this.element.style.left = `${x}px`);
    this.getX = () => parseInt(this.element.style.left.split("px")[0]);
    this.getWidth = () => this.element.clientWidth;

    this.setX(x);
    this.randomGap();
  }
}

class BarrierSet {
  width: number = main_div.clientWidth;
  height: number = main_div.clientHeight;
  gap: number = 200;
  space: number = 400;

  pares: BarrierPair[];
  animate: () => void;

  constructor(
    width: number,
    space: number,
    height: number,
    gap: number,
    scoring: Function,
    scoring2: Function,
    scoring3: Function
  ) {
    this.pares = [
      new BarrierPair(width, height, gap),
      new BarrierPair(width + space, height, gap),
      new BarrierPair(width + space * 2, height, gap),
      new BarrierPair(width + space * 3, height, gap),
      new BarrierPair(width + space * 4, height, gap),
    ];

    let newPoint = 0;
    let offset = 3;
    this.animate = () => {
      
      this.pares.forEach((par) => {
        const newPosition = par.getX() - offset;
        par.setX(newPosition);

        if (newPosition < -par.getWidth()) {
          par.setX(par.getX() + space * this.pares.length);
          par.randomGap();
        }

        const halfGame = width / 2;
        if (newPosition + offset >= halfGame && newPosition < halfGame) {
          newPoint = scoring();
          console.log(newPoint);
        } else if (newPoint == 3) {
          offset = 5;
          console.log(offset)
          scoring2();
        } else if (newPoint == 7) {
          offset = 7;
          scoring3();
        }
      });
    };
  }
}

class Bird {
  element: HTMLImageElement;
  flying: boolean = false;

  getY: () => number;
  setY: (y: number) => void;
  animate: () => void;

  constructor(height: number) {
    this.element = document.createElement("img");
    this.element.classList.add("bird");
    this.element.src = "./imgs/bird.png";

    this.getY = () => parseInt(this.element.style.bottom.split("px")[0]);
    this.setY = (y: number) => {
      this.element.style.bottom = `${y}px`;
    };

    window.onkeydown = () => (this.flying = true);
    window.onkeyup = () => (this.flying = false);

    window.ontouchstart = () => (this.flying = true);
    window.ontouchend = () => (this.flying = false);

    this.animate = () => {
      const maxHeight = height - this.element.clientHeight;
      const novoY = this.getY() + (this.flying ? 8 : -6);

      if (novoY <= 0) {
        this.setY(0);
      } else if (novoY >= maxHeight) {
        this.setY(maxHeight);
      } else {
        this.setY(novoY);
      }

      if (this.flying) {
        this.element.style.transform = "rotate(-20deg)";
      } else {
        this.element.style.transform = "rotate(20deg)";
      }
    };

    this.setY(height / 2);
  }
}

class Scoring {
  element: HTMLDivElement;
  setPoint: (point: number) => void;

  constructor() {
    this.element = document.createElement("div");
    this.element.classList.add("score");
    this.element.innerHTML = "0";
    this.setPoint = (point) => {
      this.element.innerHTML = String(point);
    };
  }
}

class SettingLevel {
  element: HTMLDivElement;
  setLevel: (level: number) => void;
  constructor() {
    this.element = document.createElement("div");
    this.element.classList.add("level");
    this.element.innerHTML = "level " + 1;

    this.setLevel = (level: number) => {
      this.element.innerHTML = `level ${level}`;
    };
  }
}

function areOverlapping(elementA: HTMLElement, elementB: HTMLElement) {
  const bird = elementA.getBoundingClientRect();
  const barrier = elementB.getBoundingClientRect();

  const horizontal =
    bird.left + bird.width >= barrier.left &&
    barrier.left + barrier.width >= bird.left;
  const vertical =
    bird.top + bird.height >= barrier.top &&
    barrier.top + barrier.height >= bird.top;

  return horizontal && vertical;
}

function collided(bird: Bird, barriers: BarrierSet) {
  let hasCollided = false;

  barriers.pares.forEach((par) => {
    const superior = par.supBarrier.element;
    const inferior = par.infBarrier.element;

    if (!hasCollided) {
      hasCollided =
        areOverlapping(bird.element, superior) ||
        areOverlapping(bird.element, inferior);
    }
  });

  return hasCollided;
}

class FlappyBird {
  point: number;
  level2: number;
  level3: number;
  width: number;
  height: number;
  bird: Bird;
  score: Scoring;
  progress: SettingLevel;
  barriers: BarrierSet;
  start: Function;

  constructor() {
    this.point = 0;
    this.level2 = 2;
    this.level3 = 3;

    this.width = main_div.clientWidth;
    this.height = main_div.clientHeight;

    this.bird = new Bird(this.height);
    main_div.appendChild(this.bird.element);

    this.score = new Scoring();
    main_div.appendChild(this.score.element);

    this.progress = new SettingLevel();
    main_div.appendChild(this.progress.element);

    this.barriers = new BarrierSet(
      this.width,
      480,
      this.height,
      240,
      () => {
        ++this.point;
        this.score.setPoint(this.point);
        return this.point;
      },
      () => {
        this.progress.setLevel(this.level2);
      },
      () => {
        this.progress.setLevel(this.level3);
      }
    );

    this.start = () => {
      startMenu.style.animation = "start 1s forwards";
      console.log("start game");
      const timer = setInterval(() => {
        this.barriers.animate();
        this.bird.animate();

        // if(collided(this.bird, this.barriers)) {
        //   clearInterval(timer)
        //   startMenu.style.animation = "end 1s forwards";
        // }
      }, 20);
    };

    this.barriers.pares.forEach((par) => main_div.appendChild(par.element));
  }
}

const gameFlappyBird = new FlappyBird();

startButton.addEventListener("click", () => gameFlappyBird.start());
startButton.addEventListener("touchstart", () => gameFlappyBird.start());
