const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const gravity = 0.2;

ctx.fillStyle = 'black';
ctx.fillRect(0, 0, 1000, 1000);

const LineWidth = 3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const sin = angle => {
  return angle % 180 === 0 ? 0 : Math.sin((angle * Math.PI) / 180);
};

const asin = angle => {
  return (Math.asin(angle) * 180) / Math.PI;
};

const cos = angle => {
  return (angle / 90) & (1 === 1) && (angle / 90) % 1 === 0
    ? 0
    : Math.cos((angle * Math.PI) / 180);
};
const acos = angle => {
  return (Math.acos(angle) * 180) / Math.PI;
};

const createShape = (
  sides,
  size,
  rotation = 0,
  position,
  style,
  static,
  angularMomentum,
  velocity
) => {
  if (sides === 0) sides = 16;

  const Length = size.length - size.length / Math.PI + size.width;

  const shapePoints = [];
  for (let i = 0; i < sides; i++) {
    const startingAngle = (360 / sides) * i;

    const x = cos(startingAngle + rotation) * Length,
      y = sin(startingAngle + rotation) * Length;

    shapePoints.push({ x, y });
  }

  return {
    id: Math.round(Math.random() * 1000000),
    coordinates: shapePoints,
    position,
    rotation,
    acceleration: { x: 0, y: gravity },
    velocity,
    angularMomentum,
    size,
    sides,
    style,
    static,
    lastPosition: { x: 0, y: 0 },
  };
};

const drawShape = shapes => {
  shapes.forEach(shape => {
    ctx.beginPath();
    ctx.lineWidth = shape.size.width;
    ctx.strokeStyle = shape.style.color;
    ctx.fillStyle = shape.style.color;

    ctx.moveTo(
      shape.position.x + shape.coordinates[0].x,
      shape.position.y + shape.coordinates[0].y
    );

    for (let i = 0; i < shape.coordinates.length + 1; i++) {
      const coordinates =
        shape.coordinates.length === i
          ? shape.coordinates[0]
          : shape.coordinates[i];

      ctx.lineTo(
        shape.position.x + coordinates.x,
        shape.position.y + coordinates.y
      );
    }
    ctx.stroke();
    if (shape.style.fill) ctx.fill();
  });
};

let r = 45;

const size = 50;
const shapes = [
  createShape(
    4,
    { length: size, width: LineWidth },
    45,
    { x: 400, y: 100 },
    { color: 'orange', fill: false },
    false,
    0,
    { x: 0, y: 0 }
  ),
  createShape(
    3,
    { length: 200, width: 3 },
    90,
    { x: 320, y: 500 },
    { color: 'white', fill: false },
    true,
    1,
    { x: 0, y: 0 }
  ),
];

let collision = [];

let lastShapeVelocity = -1;
let lastLastShapeVelocity = -1;
const movement = shape => {
  if (shape.static) return;

  if (
    collision[0] &&
    Math.abs(
      Math.abs(shape.velocity.y) -
        Math.abs(lastShapeVelocity) -
        lastLastShapeVelocity
    ) < 0.1 &&
    Math.abs(shape.velocity.y) < 5
  ) {
    shape.velocity.y = 0;
  } else if (lastShapeVelocity === 0 && shape.velocity.y > 0) {
    shape.velocity.y = 0;
  }

  if (collision[0]) {
    const l = Math.sqrt(
      Math.pow(shape.position.y - shape.lastPosition.y, 2) +
        Math.pow(shape.position.x - shape.lastPosition.x, 2)
    );

    lastLastShapeVelocity =
      Math.abs(shape.velocity.y) - Math.abs(lastShapeVelocity);
    shape.velocity.y = -shape.velocity.y * 1;
    lastShapeVelocity = shape.velocity.y;
  }
  shape.velocity.x += shape.acceleration.x;
  shape.velocity.y += shape.acceleration.y;

  shape.lastPosition = { ...shape.position };
  shape.position.x += shape.velocity.x;
  shape.position.y += shape.velocity.y;

  shape.rotation += shape.angularMomentum;

  collision = [];
};

let latch = false;

const detectCollision = shape => {
  if (shape.static) return;

  shape.coordinates.forEach((coords, index) => {
    const collisionPoints = [];
    shapes.forEach(e => {
      if (e.id === shape.id) return;

      e.coordinates.forEach((o, i) => {
        const initialPoint = shape.position.x + coords.x;
        const secondPoint = e.position.x + o.x;

        ctx.fillStyle = 'cyan';
        const angle = 360 / e.sides;

        const angleUsed = angle * (i + 1) + 30 + e.rotation;
        const fullLength = Math.abs(
          (e.position.x +
            e.coordinates[0].x -
            (e.position.x + e.coordinates[1].x)) /
            cos(angle * 1 + 30 + e.rotation)
        );
        const testLength = Math.abs(
          (initialPoint - secondPoint) / cos(angleUsed)
        );

        if (testLength > fullLength) ctx.fillStyle = 'red';
        ctx.fillRect(
          e.position.x + o.x + cos(angleUsed % 360) * testLength,
          e.position.y + o.y + sin(angleUsed % 360) * testLength,
          10,
          10
        );
        const collisionPoint = {
          x: e.position.x + o.x + cos(angleUsed % 360) * testLength,
          y: e.position.y + o.y + sin(angleUsed % 360) * testLength,
          shape: e,
        };
        if (
          Math.round(initialPoint) === Math.round(collisionPoint.x) &&
          testLength < fullLength
        ) {
          collisionPoints.push(collisionPoint);
        }
      });
    });
    if (collisionPoints[0]) {
      const sortedCollisionPoints = collisionPoints.sort((a, b) => a.y - b.y);

      if (
        shape.position.y + coords.y > sortedCollisionPoints[0].y &&
        shape.position.y + coords.y < sortedCollisionPoints[1].y
      ) {
        // console.log("Vertical Collision on point  " + index);
        // const currentShapeVelocity = { ...shape.velocity };

        const goal = shape.position.y;
        const closest = sortedCollisionPoints.reduce(function (prev, curr) {
          return Math.abs(curr.y - goal) < Math.abs(prev.y - goal)
            ? curr
            : prev;
        });
        shape.position.y = closest.y - coords.y;

        collision.push(coords);

        //console.log(currentShapeVelocity.y);
        // shape.style.color = 'magenta';

        // console.log(latch, shape.velocity.y);

        //if (false && Math.abs(currentShapeVelocity.y) < 2)
        // shape.velocity.y = null;
        // else if (index !== latch) {
        //   if (currentShapeVelocity.y < 0) return;
        //   shape.velocity.x = -currentShapeVelocity.x * 1;
        //   shape.velocity.y = -currentShapeVelocity.y * 1;
        //   latch = index;
        // }
      }
    }
  });
};

let j = 0;
const physicsLoop = shape => {
  if (shape.position.y > 500) return;
  if (shape.style.color === 'magenta') shape.style.color = 'orange';

  movement(shape);
  detectCollision(shape);

  //console.log(shape.position.y, shape.lastPosition.y);

  // shapes[0] = createShape(
  //   4,
  //   shapes[0].size,
  //   r,
  //   shapes[0].position,
  //   shapes[0].style,
  //   false,
  //   0,
  //   shapes[0].velocity
  // );
  // shapes[1] = createShape(
  //   3,
  //   { length: 200, width: 3 },
  //   -r,
  //   { x: 320, y: 500 },
  //   { color: 'white', fill: false },
  //   true,
  //   1,
  //   { x: 0, y: 0 }
  // );
  // j++;
};

const intervalFunction = () => {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 1000, 1000);

  shapes.forEach(physicsLoop);

  drawShape(shapes);
  r++;
  if (r > 360) r = 1;
};

window.onkeydown = e => {
  if (e.keyCode === 82) intervalFunction();
};
intervalFunction();
setInterval(intervalFunction, 20);
