document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                
                // Close mobile navbar if open
                if (document.querySelector('.navbar-collapse.show')) {
                    document.querySelector('.navbar-toggler').click();
                }
                
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Add active class to current nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            });
        });

        // Active menu based on scroll position
        window.addEventListener('scroll', function() {
            let current = '';
            const sections = document.querySelectorAll('section');
            const navLinks = document.querySelectorAll('.nav-link');
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 150;
                const sectionHeight = section.clientHeight;
                if (pageYOffset >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').substring(1) === current) {
                    link.classList.add('active');
                }
            });
        });

        // Game Logic
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const startButton = document.getElementById('startButton');
        const resetButton = document.getElementById('resetButton');
        const scoreBoard = document.getElementById('scoreBoard');
        const highScoreBoard = document.getElementById('highScore');
        const livesBoard = document.getElementById('lives');

        // Game variables
        let gameRunning = false;
        let gamePaused = false;
        let score = 0;
        let highScore = localStorage.getItem('brickNBallsHighScore') || 0;
        let lives = 3;
        let balls = [];
        let bricks = [];
        let paddle = { x: canvas.width / 2 - 40, width: 80, height: 10 };
        let animationId;
        let canShoot = true;

        // Display high score
        highScoreBoard.textContent = `Skor Tertinggi: ${highScore}`;

        // Game constants
        const BALL_RADIUS = 8;
        const BALL_SPEED = 5;
        const BRICK_ROWS = 5;
        const BRICK_COLS = 6;
        const BRICK_WIDTH = 60;
        const BRICK_HEIGHT = 30;
        const BRICK_PADDING = 10;
        const BRICK_OFFSET_TOP = 80;
        const BRICK_OFFSET_LEFT = 25;

        // Event listeners
        startButton.addEventListener('click', startGame);
        resetButton.addEventListener('click', resetGame);
        canvas.addEventListener('mousemove', movePaddle);
        canvas.addEventListener('touchmove', movePaddleTouch);
        canvas.addEventListener('click', shootBall);
        canvas.addEventListener('touchend', shootBall);

        // Initialize game board
        drawInitialState();

        function drawInitialState() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background
            ctx.fillStyle = "#111";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw paddle
            ctx.fillStyle = "#fdbb2d";
            ctx.fillRect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height);

            // Draw text
            ctx.font = "25px Arial";
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.fillText("Klik 'Mulai Game' untuk bermain", canvas.width / 2, canvas.height / 2);
        }

        function startGame() {
            if (gameRunning) return;

            gameRunning = true;
            gamePaused = false;
            score = 0;
            lives = 3;
            balls = [];
            canShoot = true;
            paddle = { x: canvas.width / 2 - 40, width: 80, height: 10 };

            // Create bricks
            createBricks();

            // Update score and lives display
            updateScore();
            updateLives();

            // Start animation
            animate();
        }

        function resetGame() {
            gameRunning = false;
            gamePaused = false;
            score = 0;
            lives = 3;
            balls = [];
            bricks = [];
            canShoot = true;
            paddle = { x: canvas.width / 2 - 40, width: 80, height: 10 };

            cancelAnimationFrame(animationId);
            drawInitialState();
            updateScore();
            updateLives();
        }

        function createBricks() {
            bricks = [];

            for (let c = 0; c < BRICK_COLS; c++) {
                for (let r = 0; r < BRICK_ROWS; r++) {
                    // Random brick health between 1 and 3
                    const health = Math.floor(Math.random() * 3) + 1;

                    bricks.push({
                        x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
                        y: r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
                        width: BRICK_WIDTH,
                        height: BRICK_HEIGHT,
                        health: health,
                        maxHealth: health
                    });
                }
            }
        }

        function movePaddle(e) {
            if (!gameRunning || gamePaused) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;

            // Limit paddle movement within canvas
            paddle.x = Math.max(0, Math.min(mouseX - paddle.width / 2, canvas.width - paddle.width));
        }

        function movePaddleTouch(e) {
            e.preventDefault();
            if (!gameRunning || gamePaused) return;

            const rect = canvas.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;

            // Limit paddle movement within canvas
            paddle.x = Math.max(0, Math.min(touchX - paddle.width / 2, canvas.width - paddle.width));
        }

        function shootBall() {
            if (!gameRunning || gamePaused || !canShoot) return;

            balls.push({
                x: paddle.x + paddle.width / 2,
                y: canvas.height - paddle.height - 10,
                dx: 0,
                dy: -BALL_SPEED,
                radius: BALL_RADIUS
            });

            canShoot = false;
        }

        function animate() {
            if (!gameRunning || gamePaused) return;

            animationId = requestAnimationFrame(animate);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background
            ctx.fillStyle = "#111";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw bricks
            drawBricks();

            // Draw balls
            drawBalls();

            // Draw paddle
            drawPaddle();

            // Check win condition
            if (bricks.length === 0) {
                gameOver(true);
                return;
            }

            // Check if all balls are gone and we need to reset shooting
            if (balls.length === 0 && !canShoot) {
                canShoot = true;
            }
        }

        function drawBricks() {
            bricks.forEach(brick => {
                const healthPercent = brick.health / brick.maxHealth;

                // Color based on health
                let color;
                if (healthPercent > 0.66) {
                    color = "#ff0000"; // Red for high health
                } else if (healthPercent > 0.33) {
                    color = "#ff9900"; // Orange for medium health
                } else {
                    color = "#00cc00"; // Green for low health
                }

                ctx.beginPath();
                ctx.rect(brick.x, brick.y, brick.width, brick.height);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.closePath();

                // Draw health text
                ctx.font = "16px Arial";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.fillText(brick.health, brick.x + brick.width / 2, brick.y + brick.height / 2 + 5);
            });
        }

        function drawBalls() {
            const newBalls = [];

            for (let ball of balls) {
                // Move ball
                ball.x += ball.dx;
                ball.y += ball.dy;

                // Wall collision
                if (ball.x + ball.radius > canvas.width) {
                    ball.x = canvas.width - ball.radius;
                    ball.dx = -ball.dx;
                } else if (ball.x - ball.radius < 0) {
                    ball.x = ball.radius;
                    ball.dx = -ball.dx;
                }
                if (ball.y - ball.radius < 0) {
                    ball.y = ball.radius;
                    ball.dy = -ball.dy;
                }

                // Paddle collision
                if (
                    ball.y + ball.radius >= canvas.height - paddle.height - 10 &&
                    ball.x >= paddle.x &&
                    ball.x <= paddle.x + paddle.width &&
                    ball.dy > 0
                ) {
                    ball.y = canvas.height - paddle.height - 10 - ball.radius;
                    ball.dy = -ball.dy;

                    // Adjust dx based on where the ball hit the paddle to add control
                    let hitPos = (ball.x - paddle.x) / paddle.width; // 0 (left) to 1 (right)
                    ball.dx = (hitPos - 0.5) * 10;
                }

                // Ball out of bounds (below paddle)
                if (ball.y - ball.radius > canvas.height) {
                    // Ball lost
                    lives--;
                    updateLives();
                    if (lives <= 0) {
                        gameOver(false);
                        return;
                    }
                    continue; // do not keep this ball
                }

                // Brick collision detection
                let collisionOccurred = false;
                for (let i = 0; i < bricks.length; i++) {
                    const brick = bricks[i];

                    if (detectCollision(ball, brick)) {
                        // Bounce ball
                        const brickCenterX = brick.x + brick.width / 2;
                        const brickCenterY = brick.y + brick.height / 2;

                        const dx = ball.x - brickCenterX;
                        const dy = ball.y - brickCenterY;

                        if (Math.abs(dx) > Math.abs(dy)) {
                            ball.dx = -ball.dx;
                        } else {
                            ball.dy = -ball.dy;
                        }

                        // Decrease brick health
                        brick.health--;

                        // If brick destroyed
                        if (brick.health <= 0) {
                            score += brick.maxHealth * 10; // points based on initial health
                            bricks.splice(i, 1);
                        }

                        updateScore();

                        // 10% chance to add a new ball
                        if (Math.random() < 0.1) {
                            newBalls.push({
                                x: ball.x,
                                y: ball.y,
                                dx: (Math.random() * 6 - 3),
                                dy: -Math.abs(Math.random() * 3 + 3),
                                radius: BALL_RADIUS
                            });
                        }

                        collisionOccurred = true;
                        break; // only one brick per frame
                    }
                }

                // Draw ball
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                ctx.fillStyle = "#fff";
                ctx.fill();
                ctx.closePath();

                if (!collisionOccurred) {
                    newBalls.push(ball);
                } else {
                    newBalls.push(ball);
                }
            }

            balls = newBalls;
        }

        function drawPaddle() {
            ctx.fillStyle = "#fdbb2d";
            ctx.fillRect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height);
        }

        function detectCollision(ball, brick) {
            const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
            const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));

            const distanceX = ball.x - closestX;
            const distanceY = ball.y - closestY;

            const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
            return distanceSquared < (ball.radius * ball.radius);
        }

        function updateScore() {
            scoreBoard.textContent = `Skor: ${score}`;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('brickNBallsHighScore', highScore);
                highScoreBoard.textContent = `Skor Tertinggi: ${highScore}`;
            }
        }

        function updateLives() {
            livesBoard.textContent = `Nyawa: ${lives}`;
        }

        function gameOver(isWin) {
            gameRunning = false;
            gamePaused = true;
            cancelAnimationFrame(animationId);

            // Draw game over screen
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background
            ctx.fillStyle = "#111";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw message
            ctx.font = "30px Arial";
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";

            if (isWin) {
                ctx.fillText("Selamat! Kamu Menang!", canvas.width / 2, canvas.height / 2 - 30);
            } else {
                ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 30);
            }

            ctx.font = "20px Arial";
            ctx.fillText(`Skor Akhir: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
            ctx.fillText("Klik 'Reset Game' untuk bermain lagi", canvas.width / 2, canvas.height / 2 + 70);
        }

        // Make canvas responsive
        function resizeCanvas() {
            const container = document.getElementById('gameSection');
            const containerWidth = container.clientWidth;

            if (containerWidth < 480) {
                const scale = containerWidth / 480;
                canvas.style.width = containerWidth + 'px';
                canvas.style.height = (640 * scale) + 'px';
            } else {
                canvas.style.width = '480px';
                canvas.style.height = '640px';
            }
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
