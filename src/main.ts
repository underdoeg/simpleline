import './style.css'

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
        return `rgba(${color.r},${color.g},${color.b},${color.a})`;
    }

    let is_drawing = false;
    let mouse_prev = {x: 0, y: 0};

    /// Simple method

    function draw_line_simple(c: CanvasRenderingContext2D, a: Point, b: Point) {
        c.beginPath();
        c.strokeStyle = color_to_string(color);
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

    let prev_angle: undefined | number = undefined;
    function draw_line_circles(c: CanvasRenderingContext2D, a: Point, b: Point) {
        const dist = distance(a, b);
        const angl = angle(a, b);
        const radius_half = radius / 2;
        // const radius_quarter = radius / 4;
        const radius_double = radius * 2;
        const step = radius_half;

        prev_angle = prev_angle || angl;
        
        
        for (let i = 0; i < dist; i += step) {
            
            const p1 = {x: a.x + Math.cos(prev_angle) * i, y: a.y + Math.sin(prev_angle) * i};
            const p2 = {x: a.x + Math.cos(angl) * i, y: a.y + Math.sin(angl) * i};
            const p = mix_point(p1, p2, i / dist);
            
            const radgrad = c.createRadialGradient(p.x, p.y, radius_half, p.x, p.y, radius);

            radgrad.addColorStop(0, color_to_string(color));
            radgrad.addColorStop(0.5, color_to_string({...color, a: 0.7}));
            radgrad.addColorStop(1, color_to_string({...color, a: 0}));

            c.fillStyle = radgrad;
            c.fillRect(p.x - radius, p.y - radius, radius_double, radius_double);
        }


        // c.beginPath();
        // c.strokeStyle = "red";
        // c.lineWidth = 1;
        // c.moveTo(a.x, a.y);
        // c.lineTo(a.x + Math.sin(angl) * 50, a.y + Math.cos(angl) * 50);
        // c.closePath();
        // c.stroke();
        
        prev_angle = angl;
    }

    let draw_mode = "circles";
    const draw_line = draw_mode == "circles" ? draw_line_circles : draw_line_simple;

    canvas.addEventListener('mousedown', (evt) => {
        is_drawing = true;
        mouse_prev = {x: evt.offsetX, y: evt.offsetY};
    });

    canvas.addEventListener('mousemove', (evt) => {
        const p = {x: evt.offsetX, y: evt.offsetY};
        if (is_drawing) {
            draw_line(ctx, mouse_prev, p);
        }
        mouse_prev = p;
    });

    canvas.addEventListener('mouseup', (evt) => {
        if (is_drawing) {
            draw_line(ctx, mouse_prev, {x: evt.offsetX, y: evt.offsetY});
        }
        prev_angle = undefined;
        is_drawing = false
    });


    // quadratic method

    // function draw_points(ctx: CanvasRenderingContext2D, points: Point[]) {
    //     // draw a basic circle instead
    //     ctx.beginPath();
    //     ctx.lineWidth = 20;
    //     ctx.lineJoin = 'round';
    //     ctx.lineCap = 'round';
    //     ctx.strokeStyle = 'black';
    //
    //     if (points.length < 6) {
    //         const b = points[0];
    //         ctx.arc(b.x, b.y, ctx.lineWidth / 2, 0, Math.PI * 2, !0);
    //         ctx.closePath();
    //         ctx.fill();
    //         return
    //     }
    //
    //     let i = 0;
    //     ctx.moveTo(points[i].x, points[i].y);
    //     for (i = 1; i < points.length - 2; i++) {
    //         const c = (points[i].x + points[i + 1].x) / 2,
    //             d = (points[i].y + points[i + 1].y) / 2;
    //         ctx.quadraticCurveTo(points[i].x, points[i].y, c, d)
    //     }
    //     ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    //     ctx.stroke()
    // }
    //
    //
    // let is_drawing = false;
    // // let mouse_prev = {x: 0, y: 0};
    // let mouse_history: Point[] = [];
    //
    // function add_to_history(evt: MouseEvent) {
    //     mouse_history.push({x: evt.offsetX, y: evt.offsetY});
    // }
    //
    // canvas.addEventListener('mousedown', (event) => {
    //     is_drawing = true;
    //     mouse_history = [];
    //     add_to_history(event);
    // });
    //
    // canvas.addEventListener('mousemove', (event) => {
    //     if (is_drawing) {
    //         add_to_history(event);
    //         draw_points(ctx, mouse_history);
    //     }
    // });
    //
    // canvas.addEventListener('mouseup', (_event) => {
    //     if (is_drawing) {
    //         add_to_history(_event);
    //         draw_points(ctx, mouse_history);
    //     }
    //     is_drawing = false;
    //     mouse_history = [];
    // });
    //


}

init_canvas(document.querySelector<HTMLElement>('#canvas'))