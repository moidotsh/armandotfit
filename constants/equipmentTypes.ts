// constants/equipmentTypes.ts
// Defines all equipment types and categories for the app

// Main equipment categories
export enum EquipmentCategory {
    BODYWEIGHT = 'Bodyweight',
    FREE_WEIGHT = 'FreeWeight',
    MACHINE = 'Machine',
    CABLE = 'Cable',
    SMITH = 'Smith',
    STATION = 'Station'
  }

// Equipment manufacturers for gym-specific differentiation
export enum EquipmentManufacturer {
    LIFEFITNESS = 'Lifefitness',
    NAUTILUS = 'Nautilus',
    HAMMER_STRENGTH = 'Hammer Strength',
    CYBEX = 'Cybex',
    PRECOR = 'Precor',
    MATRIX = 'Matrix',
    TECHNOGYM = 'Technogym',
    HOIST = 'Hoist',
    FREE_MOTION = 'FreeMotion',
    STAR_TRAC = 'Star Trac',
    PENTLAND = 'Pentland',
    PANATTA = 'Panatta',
    GYM80 = 'Gym80',
    CUSTOM = 'Custom'
  }
  
  // Free weight subcategories
  export enum FreeWeightType {
    DUMBBELL = 'Dumbbell',
    BARBELL = 'Barbell',
    KETTLEBELL = 'Kettlebell',
    WEIGHT_PLATE = 'WeightPlate'
  }
  
  // Common equipment stations/setups
  export enum StationType {
    BENCH = 'Bench',
    INCLINE_BENCH = 'Incline Bench',
    DECLINE_BENCH = 'Decline Bench',
    PULL_UP_BAR = 'Pull-up Bar',
    DIP_BARS = 'Dip Bars',
    SQUAT_RACK = 'Squat Rack',
    PLATFORM = 'Platform'
  }
  
  // Common machine types
  export enum MachineType {
    LEG_PRESS = 'Leg Press',
    CHEST_PRESS = 'Chest Press',
    CHEST_FLY = 'Chest Fly',
    LAT_PULLDOWN = 'Lat Pulldown',
    SEATED_ROW = 'Seated Row',
    SHOULDER_PRESS = 'Shoulder Press',
    LEG_EXTENSION = 'Leg Extension',
    LEG_CURL = 'Leg Curl',
    HIP_ADDUCTION = 'Hip Adduction',
    HIP_ABDUCTION = 'Hip Abduction',
    AB_CRUNCH = 'Ab Crunch',
    BACK_EXTENSION = 'Back Extension',
    CALF_RAISE = 'Calf Raise',
    TRICEP_EXTENSION = 'Tricep Extension',
    BICEP_CURL = 'Bicep Curl',
    PECTORAL_CONTRACTOR = 'Pectoral Contractor',
    HIP_THRUST = 'Hip Thrust'
  }
  
  // Cable attachment types
  export enum CableAttachment {
    STRAIGHT_BAR = 'Straight Bar',
    ROPE = 'Rope',
    V_BAR = 'V-Bar',
    SINGLE_HANDLE = 'Single Handle',
    DOUBLE_HANDLE = 'Double Handle',
    ANKLE_STRAP = 'Ankle Strap',
    LAT_BAR = 'Lat Bar'
  }
  
  // Equipment interface for use in exercise definitions
  export interface Equipment {
    category: EquipmentCategory;
    // Optional fields based on category
    subType?: FreeWeightType | StationType | MachineType;
    attachment?: CableAttachment;
    manufacturer?: EquipmentManufacturer; // Equipment manufacturer
    model?: string;                       // Specific model name/number
    name?: string;                        // For custom or specific equipment names
  }
  
  // Helper function to create equipment objects more easily
  export function createEquipment(
    category: EquipmentCategory,
    subType?: FreeWeightType | StationType | MachineType,
    attachment?: CableAttachment,
    manufacturer?: EquipmentManufacturer,
    model?: string,
    name?: string
  ): Equipment {
    return {
      category,
      subType,
      attachment,
      manufacturer,
      model,
      name
    };
  }

  // Common exercise tags for variations and techniques
  export const CommonExerciseTags = {
    // Variation types
    ECCENTRIC: { id: 'ecc', tag: 'ECC', name: 'Eccentric-focused', category: 'emphasis' as const },
    CONCENTRIC: { id: 'con', tag: 'CON', name: 'Concentric-focused', category: 'emphasis' as const },
    ISOMETRIC: { id: 'iso', tag: 'ISO', name: 'Isometric hold', category: 'technique' as const },
    PAUSE: { id: 'pause', tag: 'PAUSE', name: 'Pause rep', category: 'technique' as const },
    PARTIAL: { id: 'partial', tag: 'PARTIAL', name: 'Partial range', category: 'technique' as const },
    
    // Grip variations
    WIDE: { id: 'wide', tag: 'WIDE', name: 'Wide grip', category: 'variation' as const },
    NARROW: { id: 'narrow', tag: 'NARROW', name: 'Narrow grip', category: 'variation' as const },
    CLOSE: { id: 'close', tag: 'CLOSE', name: 'Close grip', category: 'variation' as const },
    NEUTRAL: { id: 'neutral', tag: 'NEUTRAL', name: 'Neutral grip', category: 'variation' as const },
    REVERSE: { id: 'reverse', tag: 'REV', name: 'Reverse grip', category: 'variation' as const },
    HOOK: { id: 'hook', tag: 'HOOK', name: 'Hook grip', category: 'variation' as const },
    
    // Stance variations
    SUMO: { id: 'sumo', tag: 'SUMO', name: 'Sumo stance', category: 'variation' as const },
    NARROW_STANCE: { id: 'narrow-stance', tag: 'NARROW-ST', name: 'Narrow stance', category: 'variation' as const },
    
    // Equipment modifiers
    CHAINS: { id: 'chains', tag: 'CHAIN', name: 'With chains', category: 'equipment' as const },
    BANDS: { id: 'bands', tag: 'BAND', name: 'With bands', category: 'equipment' as const },
    SLINGSHOT: { id: 'slingshot', tag: 'SLING', name: 'With slingshot', category: 'equipment' as const },
    BOARDS: { id: 'boards', tag: 'BOARD', name: 'Board press', category: 'equipment' as const },
    
    // Other techniques
    DROPSET: { id: 'dropset', tag: 'DROP', name: 'Drop set', category: 'technique' as const },
    SUPSET: { id: 'superset', tag: 'SUPER', name: 'Superset', category: 'technique' as const },
    REST_PAUSE: { id: 'rest-pause', tag: 'RP', name: 'Rest-pause', category: 'technique' as const },
    MYO_REPS: { id: 'myo-reps', tag: 'MYO', name: 'Myo-reps', category: 'technique' as const }
  };
  
  // Commonly used equipment combinations for quick reference
  export const CommonEquipment = {
    // Bodyweight
    BODYWEIGHT: createEquipment(EquipmentCategory.BODYWEIGHT),
    
    // Free weights
    DUMBBELL: createEquipment(EquipmentCategory.FREE_WEIGHT, FreeWeightType.DUMBBELL),
    BARBELL: createEquipment(EquipmentCategory.FREE_WEIGHT, FreeWeightType.BARBELL),
    KETTLEBELL: createEquipment(EquipmentCategory.FREE_WEIGHT, FreeWeightType.KETTLEBELL),
    
    // Stations
    BENCH: createEquipment(EquipmentCategory.STATION, StationType.BENCH),
    INCLINE_BENCH: createEquipment(EquipmentCategory.STATION, StationType.INCLINE_BENCH),
    DECLINE_BENCH: createEquipment(EquipmentCategory.STATION, StationType.DECLINE_BENCH),
    
    // Machines (generic)
    LEG_PRESS: createEquipment(EquipmentCategory.MACHINE, MachineType.LEG_PRESS),
    CHEST_FLY: createEquipment(EquipmentCategory.MACHINE, MachineType.CHEST_FLY),
    LAT_PULLDOWN: createEquipment(EquipmentCategory.MACHINE, MachineType.LAT_PULLDOWN),
    
    // Cable setups
    CABLE_TRICEP_ROPE: createEquipment(EquipmentCategory.CABLE, undefined, CableAttachment.ROPE),
    LAT_PULLDOWN_BAR: createEquipment(EquipmentCategory.CABLE, undefined, CableAttachment.LAT_BAR),
    CABLE_HANDLE: createEquipment(EquipmentCategory.CABLE, undefined, CableAttachment.SINGLE_HANDLE),
    
    // Smith machine
    SMITH: createEquipment(EquipmentCategory.SMITH),
    
    // Manufacturer-specific examples (for gyms with multiple similar machines)
    CHEST_PRESS_LIFEFITNESS: createEquipment(
      EquipmentCategory.MACHINE, 
      MachineType.CHEST_PRESS, 
      undefined, 
      EquipmentManufacturer.LIFEFITNESS
    ),
    CHEST_PRESS_NAUTILUS: createEquipment(
      EquipmentCategory.MACHINE, 
      MachineType.CHEST_PRESS, 
      undefined, 
      EquipmentManufacturer.NAUTILUS
    ),
    LAT_PULLDOWN_CYBEX: createEquipment(
      EquipmentCategory.MACHINE, 
      MachineType.LAT_PULLDOWN, 
      undefined, 
      EquipmentManufacturer.CYBEX
    )
  };