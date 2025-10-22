// Supabase integration enabled
import { supabase } from '../../../config/supabase-init.js';

export class MaterialsDisplay {
    static init() {
        try {
            // Initialize elements with null checks
            this.elements = {
                loading: document.getElementById('loading-state'),
                emptyState: document.getElementById('empty-state'),
                featuredContainer: document.getElementById('featured-container'),
                featuredList: document.getElementById('featured-materials'),
                materialsContainer: document.getElementById('materials-container'),
                materialsList: document.getElementById('materials-list'),
                materialsCount: document.getElementById('materials-count'),
                searchInput: document.getElementById('search-input'),
                filterButtons: document.querySelectorAll('.filter-btn'),
                refreshBtn: document.getElementById('refresh-btn')
            };
            
            // Verify required elements exist
            const requiredElements = ['materialsList'];
            for (const elem of requiredElements) {
                if (!this.elements[elem]) {
                    console.error(`Required element not found: ${elem}`);
                    return;
                }
            }
            
            this.materials = [];
            this.featuredMaterials = [];
            this.currentFilter = 'all';
            this.searchQuery = '';
            
            this.setupEventListeners();
            this.loadMaterials();
        } catch (error) {
            console.error('Error initializing MaterialsDisplay:', error);
            this.showError('Gagal memuat halaman. Silakan refresh halaman.');
        }
    }
}
