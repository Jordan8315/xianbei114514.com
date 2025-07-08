document.addEventListener('DOMContentLoaded', () => {
    // 游戏状态
    let board = []; // 存储完整的数独解
    let puzzle = []; // 存储当前谜题（用户看到的）
    let solution = []; // 存储正确答案
    let selectedCell = null; // 当前选中的单元格
    let timer = null; // 计时器
    let timeElapsed = 0; // 已用时间（秒）
    let gameStarted = false; // 游戏是否已开始
    let gridSize = 9; // 默认9x9网格
    let highlight = 1; //高亮

    // 初始化数独棋盘
    function initializeBoard(rows = 9, cols = 9) {
        gridSize = Math.max(rows, cols);
        const grid = document.getElementById('sudoku-grid');
        grid.innerHTML = '';

        // 设置网格样式
        grid.style.gridTemplateColumns = `repeat(${cols}, minmax(30px, 1fr))`;
        grid.style.gridTemplateRows = `repeat(${rows}, minmax(30px, 1fr))`;

        // 计算子网格大小
        const subgridRows = Math.floor(Math.sqrt(rows));
        const subgridCols = Math.floor(Math.sqrt(cols));

        // 创建单元格
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                // 计算单元格样式（处理子网格的粗线）
                let cellClass = 'cell-border flex items-center justify-center text-lg md:text-xl font-medium';

                // 子网格分隔线
                if ((i + 1) % subgridRows === 0 && i < rows - 1) cellClass += ' border-b-2';
                if ((j + 1) % subgridCols === 0 && j < cols - 1) cellClass += ' border-r-2';

                const cell = document.createElement('div');
                cell.id = `cell-${i}-${j}`;
                cell.className = cellClass;
                cell.dataset.row = i;
                cell.dataset.col = j;

                // 单元格点击事件
                cell.addEventListener('click', () => selectCell(i, j));

                grid.appendChild(cell);
            }
        }

        // 创建数字选择器
        const numberPad = document.getElementById('number-pad');
        numberPad.innerHTML = '';
        numberPad.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        for (let i = 1; i <= cols; i++) {
            const button = document.createElement('button');
            button.className = 'bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md h-10 flex items-center justify-center font-bold transition-colors duration-200';
            button.textContent = i;

            // 数字按钮点击事件
            button.addEventListener('click', () => {
                if (selectedCell) {
                    const row = selectedCell.dataset.row;
                    const col = selectedCell.dataset.col;
                    fillCell(row, col, i);
                }
            });

            numberPad.appendChild(button);
        }
    }

    // 选择单元格
    function selectCell(row, col) {
        // 取消之前选中的单元格
        if (selectedCell) {
            selectedCell.classList.remove('cell-selected');
        }

        // 选择新单元格
        selectedCell = document.getElementById(`cell-${row}-${col}`);

        // 如果是预填的数字，不允许选择
        if (selectedCell.classList.contains('text-gray-800')) {
            selectedCell = null;
            return;
        }

        // 高亮新选中的单元格
        if (selectedCell && highlight == 1) {
            selectedCell.classList.add('cell-selected');

            // 移除所有高亮
            document.querySelectorAll('.cell-highlight').forEach(cell => {
                cell.classList.remove('cell-highlight');
            });
        }
    }

    // 填充单元格
    function fillCell(row, col, number) {
        if (puzzle[row][col] !== 0) return; // 如果单元格已经有数字，不填充

        const cell = document.getElementById(`cell-${row}-${col}`);
        cell.textContent = number;
        cell.classList.add('text-primary');

        // 检查是否与答案一致
        if (number === solution[row][col]) {
            cell.classList.remove('cell-error');
            puzzle[row][col] = number;
        } else {
            cell.classList.add('cell-error');
        }

        // 检查游戏是否完成
        checkGameCompletion();
    }

    // 清除单元格
    function clearCell(row, col) {
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (cell.classList.contains('text-gray-800')) return; // 如果是预填的数字，不清除

        cell.textContent = '';
        cell.classList.remove('text-primary', 'cell-error');
        puzzle[row][col] = 0;
    }

    // 生成新的数独游戏
    function generateNewGame() {
        const rows = parseInt(document.getElementById('rows').value) || 9;
        const cols = parseInt(document.getElementById('cols').value) || 9;

        if (highlight == 0) {
            highlight = 1
        }

        if (rows < 3 || rows > 9 || cols < 3 || cols > 9) {
            alert('请输入3-9之间的行数和列数');
            return;
        }

        // 停止之前的计时器
        if (timer) {
            clearInterval(timer);
            timer = null;
        }

        // 重置游戏状态
        timeElapsed = 0;
        document.getElementById('timer').textContent = '00:00';
        document.getElementById('progress').textContent = '0%';
        gameStarted = true;

        // 初始化棋盘
        initializeBoard(rows, cols);

        // 生成完整的数独解
        solution = generateSolution(rows, cols);
        board = JSON.parse(JSON.stringify(solution));

        // 根据难度移除一些数字生成谜题
        const difficulty = document.getElementById('difficulty').value;
        puzzle = removeNumbers(board, difficulty, rows, cols);

        // 渲染数独谜题
        renderPuzzle(rows, cols);

        // 开始计时
        startTimer();

        // 显示顶部按钮和数字键盘
        document.getElementById('top-buttons').classList.remove('hidden');
        document.getElementById('number-pad').classList.remove('hidden');
    }

    // 生成完整的数独解
    function generateSolution(rows, cols) {
        const solution = Array(rows).fill().map(() => Array(cols).fill(0));

        // 使用回溯法生成数独解
        function backtrack(row, col) {
            if (row === rows) return true;

            const nextRow = col === cols - 1 ? row + 1 : row;
            const nextCol = col === cols - 1 ? 0 : col + 1;

            // 随机尝试数字1-cols
            const numbers = Array.from({ length: cols }, (_, i) => i + 1);
            shuffleArray(numbers);

            for (const num of numbers) {
                if (isValid(solution, row, col, num, rows, cols)) {
                    solution[row][col] = num;

                    if (backtrack(nextRow, nextCol)) {
                        return true;
                    }

                    solution[row][col] = 0;
                }
            }

            return false;
        }

        backtrack(0, 0);
        return solution;
    }

    // 检查数字是否可以放在指定位置
    function isValid(grid, row, col, num, rows, cols) {
        // 检查行
        for (let i = 0; i < cols; i++) {
            if (grid[row][i] === num) return false;
        }

        // 检查列
        for (let i = 0; i < rows; i++) {
            if (grid[i][col] === num) return false;
        }

        // 检查子网格
        const subgridRows = Math.floor(Math.sqrt(rows));
        const subgridCols = Math.floor(Math.sqrt(cols));
        const startRow = Math.floor(row / subgridRows) * subgridRows;
        const startCol = Math.floor(col / subgridCols) * subgridCols;

        for (let i = startRow; i < startRow + subgridRows; i++) {
            for (let j = startCol; j < startCol + subgridCols; j++) {
                if (grid[i][j] === num) return false;
            }
        }

        return true;
    }

    // 随机打乱数组
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 根据难度移除一些数字
    function removeNumbers(board, difficulty, rows, cols) {
        const puzzle = JSON.parse(JSON.stringify(board));
        let cellsToRemove = 0;
        const totalCells = rows * cols;

        // 根据难度确定要移除的数字数量
        switch (difficulty) {
            case 'easy':
                cellsToRemove = Math.floor(totalCells * 0.4);
                break;
            case 'medium':
                cellsToRemove = Math.floor(totalCells * 0.55);
                break;
            case 'hard':
                cellsToRemove = Math.floor(totalCells * 0.7);
                break;
            case 'expert':
                cellsToRemove = Math.floor(totalCells * 0.8);
                break;
            default:
                cellsToRemove = Math.floor(totalCells * 0.55);
        }

        // 随机选择要移除的单元格
        const cells = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                cells.push({ row: i, col: j });
            }
        }
        shuffleArray(cells);

        // 移除选定的单元格
        for (let i = 0; i < cellsToRemove; i++) {
            const { row, col } = cells[i];
            puzzle[row][col] = 0;
        }

        return puzzle;
    }

    // 渲染数独谜题
    function renderPuzzle(rows, cols) {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const cell = document.getElementById(`cell-${i}-${j}`);

                if (puzzle[i][j] !== 0) {
                    cell.textContent = puzzle[i][j];
                    cell.classList.add('text-gray-800');
                } else {
                    cell.textContent = '';
                    cell.classList.remove('text-gray-800', 'text-primary', 'cell-error');
                }
            }
        }

        // 重置选中单元格
        if (selectedCell) {
            selectedCell.classList.remove('cell-selected');
            selectedCell = null;
        }

        // 清除高亮
        document.querySelectorAll('.cell-highlight').forEach(cell => {
            cell.classList.remove('cell-highlight');
        });
    }

    // 开始计时器
    function startTimer() {
        if (timer) clearInterval(timer);

        timer = setInterval(() => {
            timeElapsed++;
            updateTimerDisplay();
        }, 1000);
    }

    // 更新计时器显示
    function updateTimerDisplay() {
        const minutes = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
        const seconds = (timeElapsed % 60).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${minutes}:${seconds}`;
    }

    // 检查游戏是否完成
    function checkGameCompletion() {
        const rows = document.getElementById('rows').value;
        const cols = document.getElementById('cols').value;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (puzzle[i][j] === 0 || puzzle[i][j] !== solution[i][j]) {
                    updateProgress(rows, cols);
                    return false;
                }
            }
        }

        // 游戏完成
        clearInterval(timer);
        timer = null;
        showResultModal(true);
        return true;
    }

    // 更新完成度
    function updateProgress(rows, cols) {
        let filledCells = 0;
        const totalCells = rows * cols;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (puzzle[i][j] !== 0) {
                    filledCells++;
                }
            }
        }

        const progress = Math.round((filledCells / totalCells) * 100);
        document.getElementById('progress').textContent = `${progress}%`;
    }

    // 显示提示
    function showHint() {
        if (!gameStarted) return;

        const rows = document.getElementById('rows').value;
        const cols = document.getElementById('cols').value;

        // 找到一个空单元格
        let emptyCells = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (puzzle[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }

        if (emptyCells.length === 0) return;

        // 随机选择一个空单元格
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const { row, col } = randomCell;

        // 填入正确的数字
        fillCell(row, col, solution[row][col]);

        // 选中这个单元格
        selectCell(row, col);
    }

    // 显示答案
    function showSolution() {
        if (!gameStarted) return;

        const rows = document.getElementById('rows').value;
        const cols = document.getElementById('cols').value;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (puzzle[i][j] === 0) {
                    fillCell(i, j, solution[i][j]);
                }
            }
        }

        // 停止计时器
        clearInterval(timer);
        timer = null;
    }

    // 显示结果弹窗
    function showResultModal(isSuccess) {
        const modal = document.getElementById('result-modal');
        const icon = document.getElementById('result-icon');
        const title = document.getElementById('result-title');
        const message = document.getElementById('result-message');

        if (isSuccess) {
            document.querySelectorAll('.cell-highlight').forEach(cell => {
                cell.classList.remove('cell-highlight');
            });
            renderPuzzle(rows, cols)
            progress = 100;
            document.getElementById('progress').textContent = `${progress}%`;
            icon.className = 'fa fa-trophy text-6xl text-accent mb-4';
            title.textContent = '恭喜你！';
            title.className = 'text-2xl font-bold mb-2 text-secondary';
            message.textContent = `你完成了${document.getElementById('rows').value}x${document.getElementById('cols').value}数独游戏，用时 ${Math.floor(timeElapsed / 60)} 分 ${timeElapsed % 60} 秒。`;
        }

        // 显示弹窗并添加动画
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('opacity-100');
            modal.querySelector('div').classList.add('scale-100');
            modal.querySelector('div').classList.remove('scale-95');
        }, 10);
    }

    // 隐藏结果弹窗
    function hideResultModal() {
        highlight = 0;
        const modal = document.getElementById('result-modal');
        modal.classList.remove('opacity-100');
        modal.querySelector('div').classList.remove('scale-100');
        modal.querySelector('div').classList.add('scale-95');

        // 隐藏顶部按钮和数字键盘
        document.getElementById('top-buttons').classList.add('hidden');
        document.getElementById('number-pad').classList.add('hidden');

        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    // 初始化事件监听器
    document.getElementById('new-game').addEventListener('click', generateNewGame);
    document.getElementById('clear').addEventListener('click', () => {
        if (selectedCell) {
            const row = selectedCell.dataset.row;
            const col = selectedCell.dataset.col;
            clearCell(row, col);
        }
    });
    document.getElementById('hint').addEventListener('click', showHint);
    document.getElementById('solve').addEventListener('click', showSolution);
    document.getElementById('play-again').addEventListener('click', generateNewGame);
    // 为关闭按钮添加点击事件监听器
    document.getElementById('close-modal').addEventListener('click', hideResultModal);

    // 初始化游戏
    generateNewGame();
});