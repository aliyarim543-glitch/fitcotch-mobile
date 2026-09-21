export type Role = "trainer" | "trainee" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  trainer?: { id: string; name: string } | null;
  inviteCode?: string;
  branding?: Branding;
}

export interface TraineeProfile {
  _id?: string;
  heightCm: number;
  weightKg: number;
  age: number;
  gender: "male" | "female" | "other";
  experienceLevel: "beginner" | "intermediate" | "advanced";
  goals: string[];
  limitations?: string[];
  availableDaysPerWeek: number;
  equipmentAccess: "none" | "home_basic" | "full_gym";
  preferredSystem?:
    | "auto"
    | "full_body"
    | "upper_lower"
    | "push_pull_legs"
    | "five_by_five"
    | "bro_split";
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  notes?: string;
}

export interface DayPlan {
  dayOfWeek: string;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  _id: string;
  title: string;
  durationWeeks: number;
  schedule: DayPlan[];
  progression?: {
    week: number;
    guidance: string;
  }[];
  status: "draft" | "published" | "archived";
  source:
    | "ai"
    | "trainer"
    | "ai_reviewed_by_trainer"
    | "manual_builder";
}

export interface TrainerPlanSummary {
  _id: string;
  title: string;
  status: "draft" | "published" | "archived";
  source:
    | "ai"
    | "trainer"
    | "ai_reviewed_by_trainer"
    | "manual_builder";
  durationWeeks: number;
  traineeId: string;
  traineeName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressPhoto {
  _id: string;
  angle: "front" | "back" | "side";
  date: string;
  notes?: string;
  imageUrl?: string;
}

/**
 * اعلان‌های سیستم
 *
 * این تایپ باید با enum مدل Notification در بک‌اند
 * هماهنگ باشد.
 */
export type NotificationType =
  | "workout_published"
  | "workout_updated"
  | "supplement_recommended"
  | "order_status_changed"
  | "new_client_linked"
  | "new_order_received"
  | "appointment_created"
  | "appointment_updated"
  | "appointment_cancelled"
  | "appointment_deleted"
  | "new_message"
  | "general";

export interface AppNotification {
  _id: string;
  recipient: string;
  type: NotificationType;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ThemeSettings {
  preset:
    | "classic_white"
    | "black_gold"
    | "navy_sport"
    | "modern_gray"
    | "energy_green"
    | "power_red"
    | "custom";
  customColor?: string;
}

export interface Branding {
  gymName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  instagram: string;
  website: string;
  address: string;
  theme?: ThemeSettings;
}

export interface ThemePreset {
  label: string;
  bg: string;
  accent: string;
  text: string;
}

export interface ProgressLog {
  _id?: string;
  date: string;
  weightKg?: number;
  bodyFatPercent?: number;
  measurements?: {
    chestCm?: number;
    waistCm?: number;
    hipCm?: number;
    armCm?: number;
    thighCm?: number;
  };
  notes?: string;
}

export interface TrainerSummary {
  totalClients: number;
  activePrograms: number;
  totalPrograms: number;
}

export interface TrainerTimelineWeek {
  weekStart: string;
  count: number;
}

export interface RecentActivity {
  newClients: {
    name: string;
    date: string;
  }[];
  recentPlans: {
    traineeName: string;
    title: string;
    date: string;
  }[];
}

export interface ExerciseBankItem {
  _id: string;
  nameFa: string;
  nameEn?: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  equipment: string;
  equipmentAccess: string[];
  exerciseType: string;
  difficulty: string;
  defaultSets: number;
  defaultReps: string;
  isCustom: boolean;
  isFavorited?: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
  instructions?: string | null;
}

export interface Technique {
  key: string;
  label: string;
  description: string;
  params?: string[];
}

export interface BuilderExercise {
  exerciseId?: string | null;
  name: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  notes?: string;
  technique: string;
  techniqueParams?: any;
}

export interface BuilderDay {
  dayOfWeek: string;
  focus: string;
  exercises: BuilderExercise[];
}

export interface StoreProduct {
  _id: string;
  trainer: string;
  name: string;
  description?: string;
  category: string;
  priceToman: number;
  stock: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface OrderItem {
  product: string;
  name: string;
  priceToman: number;
  quantity: number;
}

export interface StoreOrder {
  _id: string;
  trainee:
    | string
    | {
        _id: string;
        name: string;
        phone?: string;
        email?: string;
      };
  trainer: string;
  items: OrderItem[];
  subtotalToman: number;
  discountToman: number;
  couponCode?: string | null;
  totalToman: number;
  status:
    | "pending_payment"
    | "paid"
    | "preparing"
    | "shipped"
    | "delivered"
    | "payment_failed"
    | "cancelled";
  shippingAddress: string;
  paymentRefId?: string | null;
  createdAt: string;
}

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export interface Coupon {
  _id: string;
  trainer: string;
  code: string;
  discountPercent?: number | null;
  discountFixedToman?: number | null;
  startDate?: string | null;
  expiresAt?: string | null;
  maxUsage?: number | null;
  usageCount: number;
  minOrderAmountToman: number;
  isActive: boolean;
  createdAt?: string;
}

export interface FoodItem {
  _id: string;
  nameFa: string;
  nameEn?: string;
  category: string;
  caloriesPer100g: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  isCustom: boolean;
}

export interface MealPlanItem {
  food?: string | null;
  name: string;
  amountGrams: number;
  calories: number;
}

export interface MealPlanMeal {
  name:
    | "breakfast"
    | "morning_snack"
    | "lunch"
    | "afternoon_snack"
    | "dinner"
    | "before_bed";
  items: MealPlanItem[];
  notes?: string;
}

export interface MealPlan {
  _id: string;
  title: string;
  meals: MealPlanMeal[];
  dailyCalorieTarget?: number | null;
  notes?: string;
  status: "draft" | "published" | "archived";
  createdAt?: string;
}

export interface TrainerMealPlanSummary {
  _id: string;
  title: string;
  status: "draft" | "published" | "archived";
  traineeId: string;
  traineeName: string;
  dailyCalorieTarget?: number | null;
  updatedAt: string;
}