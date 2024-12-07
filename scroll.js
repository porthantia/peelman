class InfiniteScroll {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.itemWidth = options.itemWidth || 200;
        this.scrollSpeed = options.scrollSpeed || 1;
        this.direction = options.direction || 'left';
        this.items = [];
        this.animationFrame = null;
        this.totalWidth = 0;

        this.container.addEventListener('click', (e) => {
            const bananaIcon = e.target.closest('.banana-icon');
            if (bananaIcon) {
                e.stopPropagation();
                e.preventDefault();
                const clickEvent = new CustomEvent('bananaClick', {
                    detail: {
                        target: bananaIcon
                    },
                    bubbles: true,
                    cancelable: true
                });
                document.dispatchEvent(clickEvent);
            }
        });

        this.init();
    }

    createScrollItem() {
        const item = document.createElement('div');
        item.className = 'text-item';
        
        const bananaIcon = document.createElement('img');
        bananaIcon.src = './images/banana.png';
        bananaIcon.alt = '';
        bananaIcon.className = 'banana-icon';
        
        const peelymanText = document.createElement('img');
        peelymanText.src = './images/peelyman-white.png';
        peelymanText.alt = 'PEELYMAN';
        peelymanText.className = 'peelyman-text';
        
        item.appendChild(bananaIcon);
        item.appendChild(peelymanText);
        
        return item;
    }

    init() {
        this.container.innerHTML = '';
        
        const screenWidth = window.innerWidth;
        const numberOfItems = Math.ceil((screenWidth * 4) / this.itemWidth);
        
        for (let i = 0; i < numberOfItems * 2; i++) {
            const item = this.createScrollItem();
            this.container.appendChild(item);
            this.items.push(item);
        }

        this.totalWidth = this.items.slice(0, numberOfItems).reduce((width, item) => {
            return width + item.offsetWidth;
        }, 0);

        this.startScroll();
    }

    startScroll() {
        let scrollPos = this.direction === 'right' ? -this.totalWidth : 0;
        let lastTimestamp = 0;
        
        const animate = (timestamp) => {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
            }

            if (lastTimestamp) {
                const delta = timestamp - lastTimestamp;
                if (this.direction === 'right') {
                    scrollPos += (this.scrollSpeed * delta) / 16;
                    if (scrollPos >= 0) {
                        scrollPos = -this.totalWidth;
                    }
                } else {
                    scrollPos += (this.scrollSpeed * delta) / 16;
                    if (scrollPos >= this.totalWidth) {
                        scrollPos = 0;
                    }
                }
            }
            lastTimestamp = timestamp;

            this.container.style.transform = `translate3d(${this.direction === 'right' ? scrollPos : -scrollPos}px, 0, 0)`;
            
            this.animationFrame = requestAnimationFrame(animate);
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    cleanup() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    reinitialize() {
        this.cleanup();
        this.init();
    }
}

// Store all scroll instances
let scrollInstances = [];

// Initialize function
function initializeScrollers() {
    // Clear existing instances
    scrollInstances.forEach(instance => {
        instance.cleanup();
        if (instance.container) {
            instance.container.innerHTML = '';
        }
    });
    scrollInstances = [];

    const scrollers = [
        { id: 'topScrollContainer', direction: 'left', speed: 1.5 },
        { id: 'bottomScrollContainer', direction: 'right', speed: 1.5 },
        { id: 'aboutScrollContainer', direction: 'left', speed: 1.5 }
    ];

    scrollers.forEach(scroller => {
        const instance = new InfiniteScroll(scroller.id, {
            direction: scroller.direction,
            scrollSpeed: scroller.speed
        });
        scrollInstances.push(instance);
    });
}

// Initialize scroll instances after page load
document.addEventListener('DOMContentLoaded', initializeScrollers);

// Add debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Reinitialize on window resize (with debounce)
window.addEventListener('resize', debounce(() => {
    initializeScrollers();
}, 250));

// Add event listener before initialization
document.addEventListener('bananaClick', () => {
    // Handle banana click logic here
    console.log('Banana clicked!');
});
 