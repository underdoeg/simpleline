import './style.css'
import {OneEuroFilter} from '1eurofilter'

type Point = {
    x: number,
    y: number
};

type Color = {
    r: number,
    g: number,
    b: number,
    a: number
}

function init_canvas(container: HTMLElement | null) {
    if (!container) {
        console.error('[CANVAS] container is invalid');
        return;
    }
    
    

    console.log('[CANVAS] init canvas');

    container!.style.width = '100%';
    container!.style.height = '100%';

    container!.innerHTML = `<canvas></canvas>`;

    const canvas = container!.children[0] as HTMLCanvasElement;

    const canvas_memory = document.createElement('canvas');

    function resize_canvas() {
        canvas.width = container!.clientWidth;
        canvas.height = container!.clientHeight;
        canvas_memory.width = container!.clientWidth;
        canvas_memory.height = container!.clientHeight;
    }

    resize_canvas();

    const observer = new ResizeObserver((_entries) => {
        resize_canvas();
    });
    observer.observe(container!);

    const ctx = canvas.getContext("2d")!;


    //////////////////////////////////////////

    let radius = 10;
    let color: Color = {r: 0, g: 0, b: 0, a: 1};

    function clear_canvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    document.addEventListener('keyup', (event) => {
        if (event.key === ' ') {
            clear_canvas();
        }
    });

    function color_to_string(color: Color) {
        return `rgba(${Math.round(color.r*255)}, ${Math.round(color.g*255)}, ${Math.round(color.b*255)}, ${color.a})`;
    }

    let is_drawing = false;
    let mouse_prev = {x: 0, y: 0};
    let mouse_history: Point[] = [];
    let draw_delay = 4;


    /// Simple method
    
    function draw_line_simple(c: CanvasRenderingContext2D, a: Point, b: Point, col: Color = color) {
        c.beginPath();
        c.strokeStyle = color_to_string(col);
        c.lineWidth = radius;
        c.lineJoin = 'round';
        c.lineCap = 'round';
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.closePath();
        c.stroke();
    }


    function distance(p1: Point, p2: Point) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    function angle(p1: Point, p2: Point) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }

    function mix(a: number, b: number, t: number) {
        return a * (1 - t) + b * t;
    }

    function mix_point(a: Point, b: Point, t: number) {
        return {x: mix(a.x, b.x, t), y: mix(a.y, b.y, t)};
    }

    // let prev_angle: undefined | number = undefined;

    function draw_line_circles(c: CanvasRenderingContext2D, a: Point, b: Point, col: Color = color) {
        const dist = distance(a, b);
        const angl = angle(a, b);
        const radius_half = radius / 2;
        // const radius_quarter = radius / 4;
        const radius_double = radius * 2;
        const step = radius_half;

        // prev_angle = prev_angle || angl;


        for (let i = 0; i < dist; i += step) {

            // const p1 = {x: a.x + Math.cos(prev_angle) * i, y: a.y + Math.sin(prev_angle) * i};
            const p = {x: a.x + Math.cos(angl) * i, y: a.y + Math.sin(angl) * i};
            // const p = mix_point(p1, p2, i / dist);

            const radgrad = c.createRadialGradient(p.x, p.y, radius_half, p.x, p.y, radius);
            // console.log('color', color_to_string(col));
            radgrad.addColorStop(0, color_to_string(col));
            radgrad.addColorStop(0.7, color_to_string({...col, a: 0.5}));
            radgrad.addColorStop(1, color_to_string({...col, a: 0}));

            c.fillStyle = radgrad;
            c.fillRect(p.x - radius, p.y - radius, radius_double, radius_double);
        }

        // prev_angle = angl;
    }

    let draw_mode = "circles";
    const draw_line = draw_mode == "circles" ? draw_line_circles : draw_line_simple;

    const frequency = 120; // Hz
    const mincutoff = .9; // Hz
    const beta = 0.01;
    const dcutoff = 1.0; // Hz
    let euro_x:undefined | OneEuroFilter = undefined;
    let euro_y:undefined | OneEuroFilter = undefined;
    let draw_started = Date.now();
    let prev_euro: Point = {x: 0, y: 0};
    
    canvas.addEventListener('mousedown', (evt) => {
        is_drawing = true;
        euro_x = new OneEuroFilter(frequency, mincutoff, beta, dcutoff);
        euro_y = new OneEuroFilter(frequency, mincutoff, beta, dcutoff);
        draw_started = Date.now();
        mouse_prev = {x: evt.offsetX, y: evt.offsetY};
        prev_euro = mouse_prev;
    });

    canvas.addEventListener('mousemove', (evt) => {
        let p = {x: evt.offsetX, y: evt.offsetY};
        if (is_drawing) {
            // draw_line(ctx, mouse_prev, p, {r: 1, g: 0, b: 0, a: 1});
            const seconds = (Date.now() - draw_started) / 1000;
            const p_euro = {
                x: euro_x!.filter(p.x, seconds), 
                y: euro_y!.filter(p.y, seconds)
            };
            draw_line(ctx, prev_euro, p_euro);
            prev_euro = p_euro;
        }
        mouse_prev = p;
    });

    canvas.addEventListener('mouseup', (evt) => {
        if (is_drawing) {
            draw_line(ctx, mouse_prev, {x: evt.offsetX, y: evt.offsetY});
        }
        // prev_angle = undefined;
        is_drawing = false
    });
    
    canvas.addEventListener('mouseleave', (evt) => {
        if (is_drawing) {
            draw_line(ctx, mouse_prev, {x: evt.offsetX, y: evt.offsetY});
        }
        // prev_angle = undefined;
        is_drawing = false
    });

}

init_canvas(document.querySelector<HTMLElement>('#canvas'))