if(!crossOriginIsolated) SharedArrayBuffer = ArrayBuffer;
let sharedBuffer = new SharedArrayBuffer(0);
const locals = {
    cols: 0,
    rows: 0,
    started: false,
    gridBuffer: new Int8Array(0),
    grid: [[0]],
    setGridIntBufferVal(col=0, row=0, val=0) {
        locals.gridBuffer[(col*locals.rows) + row] = val;
    },
    initGrid() {
        locals.started = true;
        sharedBuffer = new SharedArrayBuffer(locals.cols * locals.rows);
        locals.gridBuffer = new Int8Array(sharedBuffer);
        locals.grid=[];
        for(let c=0,r,col; c<locals.cols; c++) {
            for (col=[],r=0; r<locals.rows; r++) {
                col[r] = Math.round(Math.random());
                locals.setGridIntBufferVal(c, r, col[r]);
            }
            locals.grid[c]=col
        }
        postMessage({buffer: sharedBuffer});
        setTimeout(locals.updateGrid(), 0);
    },
    nextCellValue(col=0, row=0) {
        let nc = [0,0], oldValue=locals.grid[col][row];
        for(let i=col-1, gl=locals.grid.length,gil,j,brk; i<=col+1; i++) {
            if(i>=0 && i<gl) {
                brk = false;
                for(j=row-1, gil=locals.grid[i].length; j<=row+1; j++) {
                    if(j>=0 && j<gil) {
                        if(!(i==col && j==row)) {
                            nc[locals.grid[i][j]]++;
                            if(nc[1]>3) {
                                brk = true;
                                break;
                            }
                        }
                    }
                }
                if(brk) break;
            }
        }
        return oldValue ? ((nc[1]<2 || nc[1]>3) ? 0 : oldValue) : ((nc[1]===3) ? 1 : oldValue);
    },
    updateGrid() {
        let grid=[];
        for(let c=0,r,col; c<locals.cols; c++) {
            for (col=[],r=0; r<locals.rows; r++) {
                col[r] = locals.nextCellValue(c, r);
            }
            grid[c]=col;
        }
        locals.grid = grid;
    },
    sendGrid() {
        for(let c=0,r; c<locals.cols; c++) {
            for (r=0; r<locals.rows; r++) {
                locals.setGridIntBufferVal(c, r, locals.grid[c][r]);
            }
        }
        postMessage({buffer: sharedBuffer});
        setTimeout(locals.updateGrid(), 0);
    }
}

onmessage = ({data}) => {
    if(data.next && locals.started) locals.sendGrid();
    else if(data.stop) {
        locals.started = false;
        setTimeout(() => {
            sharedBuffer = null;
            locals.cols = locals.rows = 0;
            locals.gridBuffer = null;
            locals.grid = null;
            postMessage({stopped: true});
        }, 0);
    }
    else if(data.cols && data.rows) {
        locals.cols = data.cols;
        locals.rows = data.rows;
        locals.initGrid();
    }
}