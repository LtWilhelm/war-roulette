// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

console.log("WORKING");
const canvas = document.querySelector("#game-board");
canvas.width = 400;
canvas.height = 600;
const context = canvas.getContext('2d');
context.fillStyle = 'red';
context?.fillRect(0, 0, canvas.width, canvas.height);
