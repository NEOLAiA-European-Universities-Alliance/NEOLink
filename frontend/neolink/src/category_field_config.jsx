
export const CATEGORY_FIELD_CONFIG = {
    // Field groups with their respective fields
    BASIC_FIELDS: [
        'item_status',
        'name',
        'offered_by',
        'description'
    ],
    
    DATE_FIELDS: [
        'start_date',
        'end_date',
        'expiration'
    ],
    
    ACADEMIC_FIELDS: [
        'isced_code',
        'level_of_study',
        'learning_outcomes',
        'pedagogical_objectives'
    ],
    
    RESEARCH_FIELDS: [
        'erc_area',
        'erc_panel',
        'erc_keyword'
    ],
    
    CONTENT_FIELDS: [
        'languages',
        'speakers',
        'multimediarial_material_provided'
    ],
    
    STRUCTURE_FIELDS: [
        'university',
        'first_level_structure',
        'second_level_structure'
    ],
    
    MEDIA_FIELDS: [
        'cover'
    ]
};

// Define which field groups are visible for each category
// You can customize this based on your category names
export const getCategoryFieldGroups = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    
    // Always show basic fields
    const fieldGroups = ['BASIC_FIELDS', 'MEDIA_FIELDS'];
    
    // BIP Category
    if (name.includes('bip')) {
        return [
            ...fieldGroups,
            'DATE_FIELDS',
            'ACADEMIC_FIELDS',
            'RESEARCH_FIELDS',
            'CONTENT_FIELDS',
            'STRUCTURE_FIELDS'
        ];
    }
    
    // Coil category
    if (name.includes('coil')) {
        return [
            ...fieldGroups,
            'DATE_FIELDS',
            'ACADEMIC_FIELDS',
            'RESEARCH_FIELDS',
            'CONTENT_FIELDS',
            'STRUCTURE_FIELDS'
        ];
    }
    
    // Default: show all fields
    return [
        ...fieldGroups,
        'DATE_FIELDS',
        'ACADEMIC_FIELDS',
        'RESEARCH_FIELDS',
        'CONTENT_FIELDS',
        'STRUCTURE_FIELDS'
    ];
};

// Check if a specific field should be shown for a given category
export const shouldShowField = (fieldName, categoryName) => {
    const visibleGroups = getCategoryFieldGroups(categoryName);

    for (const groupName of visibleGroups) {
        if (CATEGORY_FIELD_CONFIG[groupName]?.includes(fieldName)) {
            return true;
        }
    }
    
    return false;
};

// Get a friendly description of what fields are shown for a category
export const getCategoryFieldDescription = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    
    if (name.includes('bip')) {
        return 'You\'ll provide all relevant details for this item.';
    }
    if (name.includes('neoteach')) {
        return 'You\'ll provide all relevant details for this item.';
    }
    return 'You\'ll provide all relevant details for this item.';
};