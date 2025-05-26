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
    name?: string; // For custom or specific equipment names
  }
  
  // Helper function to create equipment objects more easily
  export function createEquipment(
    category: EquipmentCategory,
    subType?: FreeWeightType | StationType | MachineType,
    attachment?: CableAttachment,
    name?: string
  ): Equipment {
    return {
      category,
      subType,
      attachment,
      name
    };
  }
  
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
    
    // Machines
    LEG_PRESS: createEquipment(EquipmentCategory.MACHINE, MachineType.LEG_PRESS),
    CHEST_FLY: createEquipment(EquipmentCategory.MACHINE, MachineType.CHEST_FLY),
    LAT_PULLDOWN: createEquipment(EquipmentCategory.MACHINE, MachineType.LAT_PULLDOWN),
    
    // Cable setups
    CABLE_TRICEP_ROPE: createEquipment(EquipmentCategory.CABLE, undefined, CableAttachment.ROPE),
    LAT_PULLDOWN_BAR: createEquipment(EquipmentCategory.CABLE, undefined, CableAttachment.LAT_BAR),
    CABLE_HANDLE: createEquipment(EquipmentCategory.CABLE, undefined, CableAttachment.SINGLE_HANDLE),
    
    // Smith machine
    SMITH: createEquipment(EquipmentCategory.SMITH)
  };