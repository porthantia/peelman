// Create a global audio manager
window.AudioManager = {
    context: null,
    buffer: null,
    audioPool: [], // Audio source pool
    poolSize: 10,  // Pool size

    // Initialize audio
    async init() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContextClass({ latencyHint: 'interactive' });
            const response = await fetch('./audio/click.mp3');
            const arrayBuffer = await response.arrayBuffer();
            this.buffer = await this.context.decodeAudioData(arrayBuffer);
            
            // Pre-create audio sources
            this.prepareAudioPool();
        } catch (error) {
            console.log('Audio initialization failed:', error);
        }
    },

    // Prepare audio pool
    prepareAudioPool() {
        for (let i = 0; i < this.poolSize; i++) {
            const source = this.context.createBufferSource();
            source.buffer = this.buffer;
            source.connect(this.context.destination);
            this.audioPool.push({
                source: source,
                used: false
            });
        }
    },

    // Get available audio source
    getAudioSource() {
        // Find unused audio source
        let audioEntry = this.audioPool.find(entry => !entry.used);
        
        // If no available source, create new one
        if (!audioEntry) {
            const source = this.context.createBufferSource();
            source.buffer = this.buffer;
            source.connect(this.context.destination);
            audioEntry = {
                source: source,
                used: false
            };
            this.audioPool.push(audioEntry);
        }
        
        return audioEntry;
    },

    // Play sound effect
    play() {
        if (!this.context || !this.buffer) return;
        
        try {
            if (this.context.state === 'suspended') {
                this.context.resume();
            }

            // Get an available audio source
            const audioEntry = this.getAudioSource();
            audioEntry.used = true;

            // Create a new audio source to replace the used one
            const newSource = this.context.createBufferSource();
            newSource.buffer = this.buffer;
            newSource.connect(this.context.destination);
            
            // Start playing
            audioEntry.source.start(0);
            
            // Update audio pool after playback completes
            audioEntry.source.onended = () => {
                const index = this.audioPool.indexOf(audioEntry);
                if (index !== -1) {
                    this.audioPool[index] = {
                        source: newSource,
                        used: false
                    };
                }
            };
        } catch (error) {
            console.log('Sound playback failed:', error);
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const bananaGrid = document.querySelector('.banana-grid');
    
    // Modify audio initialization method
    const initAudio = async () => {
        await window.AudioManager.init();
        // Remove initialization event listener
        document.removeEventListener('click', initAudio);
    };
    
    // Wait for first user click to initialize audio
    document.addEventListener('click', initAudio, { once: true });

    // Add click animation function
    function addClickAnimation(element) {
        // Create separate animationend handler
        const handleAnimationEnd = () => {
            element.classList.remove('banana-click-animation');
        };
        
        // Add animationend listener only once
        element.addEventListener('animationend', handleAnimationEnd);
        
        element.addEventListener('click', function() {
            // Use global audio manager to play sound
            window.AudioManager.play();
            
            // Reset animation
            element.classList.remove('banana-click-animation');
            void element.offsetWidth; // Trigger reflow to force browser to recalculate styles
            element.classList.add('banana-click-animation');
        });
    }

    // Clear existing content
    bananaGrid.innerHTML = '';
    
    // Calculate base width based on screen width
    const screenWidth = window.innerWidth;
    const baseWidth = screenWidth <= 480 ? 60 :
                     screenWidth <= 768 ? 80 :
                     screenWidth <= 1200 ? 100 : 120;
    
    // Base configuration
    const config = {
        baseWidth: baseWidth,    // Dynamic base width
        scaleFactor: 1.3,        // Scale factor for each row
        baseCount: 50,           // Initial number of bananas in first row
        rowCount: 7,             // Total number of rows
        baseOverlap: baseWidth * 0.125, // Base overlap amount (proportional to base width)
        rowSpacingRatio: 0.2,    // Row spacing ratio
        verticalOverlapRatio: 0.1 // Vertical overlap ratio (0-1, where 0 means no overlap, 1 means full overlap)
    };

    // Create rows from top to bottom
    for (let rowIndex = 0; rowIndex < config.rowCount; rowIndex++) {
        const row = document.createElement('div');
        row.className = 'banana-row';
        
        // Calculate current row scale
        const currentScale = Math.pow(config.scaleFactor, rowIndex);
        
        // Calculate number of bananas for current row (decrease by 2 each row)
        const currentCount = config.baseCount - (rowIndex * 2);
        
        // Calculate overlap and spacing for current row
        const currentOverlap = config.baseOverlap * currentScale;
        
        // Calculate banana height for current row (assuming height is 1.5x width)
        const currentHeight = (config.baseWidth * 1.5) * currentScale;
        
        // Calculate row spacing (negative value for overlap)
        const currentRowSpacing = -currentHeight * config.verticalOverlapRatio;
        
        // Set row styles
        row.style.zIndex = config.rowCount + rowIndex;
        if (rowIndex > 0) {
            row.style.marginTop = `${currentRowSpacing}px`;
        }
        
        // Create bananas for current row
        for (let i = 0; i < currentCount; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'banana-wrapper';
            
            const img = document.createElement('img');
            img.src = './images/banana.png';
            img.alt = 'Banana';
            img.className = 'banana-item';
            
            // Set banana size
            const currentWidth = config.baseWidth * currentScale;
            img.style.width = `${currentWidth}px`;
            
            // Add horizontal overlap
            if (i > 0) {
                wrapper.style.marginLeft = `-${currentOverlap}px`;
            }
            
            wrapper.appendChild(img);
            row.appendChild(wrapper);
            
            // Add click animation to each banana
            addClickAnimation(img);

            // Add random delay to the swing animation
            const delay = Math.random() * 2; // Random delay between 0-2 seconds
            img.style.animationDelay = `${delay}s`;
            img.classList.add('banana-wiggle');
        }
        
        bananaGrid.appendChild(row);
    }

    // Add animation pause/resume functionality (optional)
    function toggleAnimations(pause) {
        const bananas = document.querySelectorAll('.banana-item');
        bananas.forEach(banana => {
            banana.style.animationPlayState = pause ? 'paused' : 'running';
        });
    }

    // Optional: Pause animations when page is not visible to save resources
    document.addEventListener('visibilitychange', () => {
        toggleAnimations(document.hidden);
    });

    // Add at the beginning of DOMContentLoaded event handler
    const style = document.createElement('style');
    style.textContent = `
        .banana-item {
            cursor: pointer;
            pointer-events: auto;
        }
        .banana-click-animation {
            pointer-events: auto;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
}); 