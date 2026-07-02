import { useEffect, useState, useCallback } from "react";
import { todayISO, toISO, fromISO, addDays } from "./tracker-store";

export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  sugar: number;
};

export type Food = {
  name: string;
  emoji: string;
  // per 100g (or per 100ml for liquids)
  per100: Macros;
  // default serving in grams
  serving: number;
  unit?: "g" | "ml";
};

// Common foods — values are approximate per 100 g/ml
export const FOOD_DB: Food[] = [
  // Eggs & poultry
  { name: "Boiled egg", emoji: "🥚", per100: { calories: 155, protein: 13, carbs: 1.1, fiber: 0, sugar: 1.1 }, serving: 50 },
  { name: "Chicken breast (cooked)", emoji: "🍗", per100: { calories: 165, protein: 31, carbs: 0, fiber: 0, sugar: 0 }, serving: 150 },
  { name: "Fried chicken", emoji: "🍗", per100: { calories: 246, protein: 24, carbs: 7, fiber: 0.5, sugar: 0 }, serving: 150 },
  { name: "Chicken nuggets", emoji: "🍗", per100: { calories: 296, protein: 15, carbs: 17, fiber: 1, sugar: 0 }, serving: 100 },
  { name: "Tandoori chicken", emoji: "🍖", per100: { calories: 184, protein: 26, carbs: 3, fiber: 0.5, sugar: 1 }, serving: 150 },
  { name: "Butter chicken", emoji: "🍛", per100: { calories: 225, protein: 15, carbs: 8, fiber: 1, sugar: 3 }, serving: 200 },
  { name: "Rogan josh", emoji: "🍲", per100: { calories: 190, protein: 18, carbs: 5, fiber: 1, sugar: 1 }, serving: 200 },
  { name: "Fish curry", emoji: "🐟", per100: { calories: 170, protein: 18, carbs: 6, fiber: 1, sugar: 2 }, serving: 200 },
  { name: "Fish fry", emoji: "🐟", per100: { calories: 232, protein: 20, carbs: 8, fiber: 0.5, sugar: 0 }, serving: 150 },
  { name: "Meen curry", emoji: "🐠", per100: { calories: 165, protein: 17, carbs: 5, fiber: 0.5, sugar: 1 }, serving: 200 },

  // Grains, rice & bread
  { name: "White rice (cooked)", emoji: "🍚", per100: { calories: 130, protein: 2.7, carbs: 28, fiber: 0.4, sugar: 0.1 }, serving: 150 },
  { name: "Brown rice (cooked)", emoji: "🍙", per100: { calories: 123, protein: 2.7, carbs: 26, fiber: 1.8, sugar: 0.4 }, serving: 150 },
  { name: "Biryani (chicken)", emoji: "🍛", per100: { calories: 195, protein: 10, carbs: 25, fiber: 2, sugar: 2 }, serving: 250 },
  { name: "Hyderabadi biryani", emoji: "🍛", per100: { calories: 210, protein: 11, carbs: 27, fiber: 2, sugar: 2 }, serving: 250 },
  { name: "Pulao", emoji: "🍚", per100: { calories: 150, protein: 4, carbs: 28, fiber: 1.5, sugar: 1 }, serving: 200 },
  { name: "Khichdi", emoji: "🥣", per100: { calories: 120, protein: 4, carbs: 22, fiber: 2, sugar: 1 }, serving: 250 },
  { name: "Poha", emoji: "🍘", per100: { calories: 140, protein: 3, carbs: 28, fiber: 1.5, sugar: 1 }, serving: 200 },
  { name: "Upma", emoji: "🍘", per100: { calories: 135, protein: 3.5, carbs: 25, fiber: 2, sugar: 1 }, serving: 200 },
  { name: "Pongal", emoji: "🥣", per100: { calories: 160, protein: 4, carbs: 30, fiber: 1, sugar: 1 }, serving: 200 },
  { name: "Roti / chapati", emoji: "🫓", per100: { calories: 297, protein: 8, carbs: 56, fiber: 4, sugar: 1 }, serving: 40 },
  { name: "Naan", emoji: "🫓", per100: { calories: 311, protein: 9, carbs: 50, fiber: 2, sugar: 2 }, serving: 80 },
  { name: "Garlic naan", emoji: "🫓", per100: { calories: 330, protein: 9, carbs: 52, fiber: 2, sugar: 2 }, serving: 80 },
  { name: "Kulcha", emoji: "🫓", per100: { calories: 290, protein: 8, carbs: 48, fiber: 2, sugar: 2 }, serving: 80 },
  { name: "Aloo paratha", emoji: "🥟", per100: { calories: 260, protein: 6, carbs: 42, fiber: 3, sugar: 2 }, serving: 80 },
  { name: "Gobi paratha", emoji: "🥟", per100: { calories: 240, protein: 5, carbs: 40, fiber: 4, sugar: 2 }, serving: 80 },
  { name: "Poori", emoji: "🍞", per100: { calories: 325, protein: 7, carbs: 40, fiber: 2, sugar: 1 }, serving: 35 },
  { name: "Thepla", emoji: "🫓", per100: { calories: 240, protein: 6, carbs: 38, fiber: 3, sugar: 2 }, serving: 50 },
  { name: "Bread slice (whole wheat)", emoji: "🍞", per100: { calories: 247, protein: 13, carbs: 41, fiber: 7, sugar: 6 }, serving: 30 },
  { name: "Oats (dry)", emoji: "🥣", per100: { calories: 389, protein: 17, carbs: 66, fiber: 11, sugar: 1 }, serving: 50 },

  // South Indian
  { name: "Idli", emoji: "🍘", per100: { calories: 130, protein: 4, carbs: 27, fiber: 1, sugar: 0.5 }, serving: 60 },
  { name: "Rava idli", emoji: "🍘", per100: { calories: 150, protein: 4, carbs: 30, fiber: 1, sugar: 1 }, serving: 70 },
  { name: "Dosa", emoji: "🥞", per100: { calories: 168, protein: 4, carbs: 30, fiber: 1, sugar: 1 }, serving: 80 },
  { name: "Masala dosa", emoji: "🥞", per100: { calories: 195, protein: 5, carbs: 35, fiber: 2, sugar: 2 }, serving: 150 },
  { name: "Mysore dosa", emoji: "🥞", per100: { calories: 210, protein: 5, carbs: 38, fiber: 2, sugar: 2 }, serving: 150 },
  { name: "Rava dosa", emoji: "🥞", per100: { calories: 185, protein: 4, carbs: 33, fiber: 1.5, sugar: 1.5 }, serving: 120 },
  { name: "Onion uttapam", emoji: "🍕", per100: { calories: 150, protein: 4, carbs: 28, fiber: 2, sugar: 2 }, serving: 120 },
  { name: "Uttapam", emoji: "🍕", per100: { calories: 140, protein: 4, carbs: 26, fiber: 1.5, sugar: 1.5 }, serving: 120 },
  { name: "Medu vada", emoji: "🍩", per100: { calories: 245, protein: 8, carbs: 28, fiber: 4, sugar: 1 }, serving: 60 },
  { name: "Sambar vada", emoji: "🍩", per100: { calories: 160, protein: 6, carbs: 25, fiber: 5, sugar: 3 }, serving: 150 },
  { name: "Pesarattu", emoji: "🫛", per100: { calories: 145, protein: 6, carbs: 25, fiber: 3, sugar: 1 }, serving: 120 },
  { name: "Paniyaram", emoji: "🍳", per100: { calories: 175, protein: 5, carbs: 30, fiber: 2, sugar: 1 }, serving: 80 },
  { name: "Appam", emoji: "🥞", per100: { calories: 155, protein: 3, carbs: 33, fiber: 1, sugar: 1 }, serving: 80 },
  { name: "Puttu", emoji: "🍚", per100: { calories: 140, protein: 3, carbs: 30, fiber: 2, sugar: 1 }, serving: 100 },
  { name: "Parotta", emoji: "🫓", per100: { calories: 318, protein: 7, carbs: 48, fiber: 2, sugar: 2 }, serving: 80 },
  { name: "Kothu parotta", emoji: "🍲", per100: { calories: 250, protein: 8, carbs: 35, fiber: 2, sugar: 2 }, serving: 200 },
  { name: "Sambar", emoji: "🍲", per100: { calories: 75, protein: 4, carbs: 14, fiber: 4, sugar: 3 }, serving: 150 },
  { name: "Rasam", emoji: "🍲", per100: { calories: 45, protein: 2, carbs: 8, fiber: 2, sugar: 2 }, serving: 150 },
  { name: "Coconut chutney", emoji: "🥥", per100: { calories: 120, protein: 2, carbs: 6, fiber: 3, sugar: 3 }, serving: 50 },
  { name: "Tomato chutney", emoji: "🍅", per100: { calories: 60, protein: 1, carbs: 12, fiber: 2, sugar: 6 }, serving: 50 },
  { name: "Avial", emoji: "🥦", per100: { calories: 95, protein: 2, carbs: 10, fiber: 3, sugar: 3 }, serving: 150 },
  { name: "Kootu", emoji: "🍲", per100: { calories: 85, protein: 3, carbs: 12, fiber: 3, sugar: 2 }, serving: 150 },
  { name: "Poriyal", emoji: "🥬", per100: { calories: 70, protein: 2, carbs: 10, fiber: 3, sugar: 2 }, serving: 100 },
  { name: "Lemon rice", emoji: "🍚", per100: { calories: 155, protein: 3, carbs: 32, fiber: 1, sugar: 1 }, serving: 200 },
  { name: "Tamarind rice", emoji: "🍚", per100: { calories: 170, protein: 3, carbs: 35, fiber: 2, sugar: 2 }, serving: 200 },
  { name: "Curd rice", emoji: "🍚", per100: { calories: 130, protein: 4, carbs: 24, fiber: 0.5, sugar: 3 }, serving: 200 },
  { name: "Payasam", emoji: "🍮", per100: { calories: 140, protein: 3, carbs: 25, fiber: 0.5, sugar: 18 }, serving: 100 },
  { name: "Kerala fish curry", emoji: "🐟", per100: { calories: 175, protein: 16, carbs: 6, fiber: 1, sugar: 2 }, serving: 200 },

  // North Indian curries & staples
  { name: "Dal (cooked)", emoji: "🍲", per100: { calories: 116, protein: 9, carbs: 20, fiber: 8, sugar: 1.8 }, serving: 200 },
  { name: "Dal makhani", emoji: "🍲", per100: { calories: 160, protein: 7, carbs: 18, fiber: 5, sugar: 2 }, serving: 200 },
  { name: "Rajma", emoji: "🫘", per100: { calories: 130, protein: 9, carbs: 22, fiber: 8, sugar: 2 }, serving: 200 },
  { name: "Chole", emoji: "🫘", per100: { calories: 140, protein: 9, carbs: 24, fiber: 8, sugar: 2 }, serving: 200 },
  { name: "Chana masala", emoji: "🫘", per100: { calories: 135, protein: 9, carbs: 23, fiber: 8, sugar: 2 }, serving: 200 },
  { name: "Palak paneer", emoji: "🍛", per100: { calories: 145, protein: 10, carbs: 8, fiber: 3, sugar: 2 }, serving: 200 },
  { name: "Kadai paneer", emoji: "🍛", per100: { calories: 175, protein: 11, carbs: 10, fiber: 2, sugar: 3 }, serving: 200 },
  { name: "Mutter paneer", emoji: "🍛", per100: { calories: 165, protein: 10, carbs: 12, fiber: 3, sugar: 3 }, serving: 200 },
  { name: "Malai kofta", emoji: "🍛", per100: { calories: 200, protein: 7, carbs: 14, fiber: 2, sugar: 4 }, serving: 200 },
  { name: "Aloo gobi", emoji: "🥦", per100: { calories: 90, protein: 2, carbs: 12, fiber: 3, sugar: 2 }, serving: 150 },
  { name: "Baingan bharta", emoji: "🍆", per100: { calories: 85, protein: 2, carbs: 10, fiber: 4, sugar: 3 }, serving: 150 },
  { name: "Kadhi", emoji: "🍲", per100: { calories: 110, protein: 5, carbs: 12, fiber: 1, sugar: 3 }, serving: 200 },
  { name: "Rajma chawal", emoji: "🍛", per100: { calories: 150, protein: 7, carbs: 28, fiber: 6, sugar: 2 }, serving: 300 },
  { name: "Chole bhature", emoji: "🍛", per100: { calories: 220, protein: 8, carbs: 32, fiber: 6, sugar: 3 }, serving: 300 },

  // Street food / snacks / junk / fast food
  { name: "Samosa", emoji: "🥟", per100: { calories: 262, protein: 4, carbs: 30, fiber: 2, sugar: 2 }, serving: 50 },
  { name: "Pakora", emoji: "🍘", per100: { calories: 280, protein: 6, carbs: 28, fiber: 3, sugar: 2 }, serving: 80 },
  { name: "Pani puri", emoji: "🍽️", per100: { calories: 180, protein: 3, carbs: 32, fiber: 2, sugar: 3 }, serving: 100 },
  { name: "Bhel puri", emoji: "🍿", per100: { calories: 150, protein: 4, carbs: 28, fiber: 3, sugar: 4 }, serving: 150 },
  { name: "Vada pav", emoji: "🍔", per100: { calories: 245, protein: 6, carbs: 35, fiber: 3, sugar: 2 }, serving: 120 },
  { name: "Pav bhaji", emoji: "🍛", per100: { calories: 165, protein: 4, carbs: 28, fiber: 4, sugar: 4 }, serving: 250 },
  { name: "Aloo tikki", emoji: "🍘", per100: { calories: 210, protein: 3, carbs: 30, fiber: 2, sugar: 2 }, serving: 80 },
  { name: "Momos (steamed)", emoji: "🥟", per100: { calories: 160, protein: 6, carbs: 28, fiber: 2, sugar: 1 }, serving: 100 },
  { name: "Momos (fried)", emoji: "🥟", per100: { calories: 240, protein: 6, carbs: 28, fiber: 2, sugar: 1 }, serving: 100 },
  { name: "Maggi noodles", emoji: "🍜", per100: { calories: 345, protein: 7, carbs: 50, fiber: 2, sugar: 2 }, serving: 70 },
  { name: "Instant noodles", emoji: "🍜", per100: { calories: 330, protein: 7, carbs: 48, fiber: 2, sugar: 2 }, serving: 70 },
  { name: "Hakka noodles", emoji: "🍜", per100: { calories: 195, protein: 6, carbs: 32, fiber: 2, sugar: 2 }, serving: 200 },
  { name: "Fried rice", emoji: "🍛", per100: { calories: 185, protein: 5, carbs: 32, fiber: 1.5, sugar: 1.5 }, serving: 250 },
  { name: "Spring roll", emoji: "🌯", per100: { calories: 220, protein: 5, carbs: 28, fiber: 2, sugar: 2 }, serving: 80 },
  { name: "Hot dog", emoji: "🌭", per100: { calories: 270, protein: 10, carbs: 23, fiber: 1, sugar: 3 }, serving: 120 },
  { name: "Sandwich", emoji: "🥪", per100: { calories: 240, protein: 8, carbs: 30, fiber: 2, sugar: 3 }, serving: 150 },
  { name: "Shawarma", emoji: "🌯", per100: { calories: 280, protein: 12, carbs: 28, fiber: 2, sugar: 3 }, serving: 200 },
  { name: "Chicken burger", emoji: "🍔", per100: { calories: 260, protein: 13, carbs: 25, fiber: 1, sugar: 4 }, serving: 200 },
  { name: "Cheese burger", emoji: "🍔", per100: { calories: 295, protein: 15, carbs: 24, fiber: 1, sugar: 5 }, serving: 200 },
  { name: "Burger", emoji: "🍔", per100: { calories: 295, protein: 17, carbs: 24, fiber: 1, sugar: 5 }, serving: 200 },
  { name: "French fries", emoji: "🍟", per100: { calories: 312, protein: 3, carbs: 41, fiber: 3, sugar: 0 }, serving: 100 },
  { name: "Onion rings", emoji: "🧅", per100: { calories: 276, protein: 4, carbs: 33, fiber: 2, sugar: 4 }, serving: 100 },
  { name: "Pizza slice", emoji: "🍕", per100: { calories: 266, protein: 11, carbs: 33, fiber: 2.3, sugar: 3.6 }, serving: 110 },
  { name: "Nachos", emoji: "🌮", per100: { calories: 306, protein: 5, carbs: 38, fiber: 4, sugar: 2 }, serving: 100 },
  { name: "Taco", emoji: "🌮", per100: { calories: 220, protein: 10, carbs: 25, fiber: 3, sugar: 2 }, serving: 120 },
  { name: "Burrito", emoji: "🌯", per100: { calories: 250, protein: 10, carbs: 35, fiber: 5, sugar: 2 }, serving: 250 },
  { name: "Quesadilla", emoji: "🧀", per100: { calories: 270, protein: 11, carbs: 28, fiber: 2, sugar: 2 }, serving: 180 },
  { name: "Popcorn (buttered)", emoji: "🍿", per100: { calories: 387, protein: 8, carbs: 45, fiber: 8, sugar: 1 }, serving: 50 },
  { name: "Popcorn (plain)", emoji: "🍿", per100: { calories: 387, protein: 13, carbs: 74, fiber: 13, sugar: 0 }, serving: 30 },

  // Dairy & drinks
  { name: "Milk (whole)", emoji: "🥛", per100: { calories: 61, protein: 3.2, carbs: 4.8, fiber: 0, sugar: 5.1 }, serving: 200, unit: "ml" },
  { name: "Greek yogurt", emoji: "🍶", per100: { calories: 59, protein: 10, carbs: 3.6, fiber: 0, sugar: 3.2 }, serving: 150 },
  { name: "Paneer", emoji: "🧀", per100: { calories: 296, protein: 25, carbs: 3.6, fiber: 0, sugar: 2.6 }, serving: 100 },
  { name: "Lassi (sweet)", emoji: "🥤", per100: { calories: 95, protein: 3, carbs: 16, fiber: 0, sugar: 14 }, serving: 250, unit: "ml" },
  { name: "Lassi (salted)", emoji: "🥤", per100: { calories: 60, protein: 3, carbs: 5, fiber: 0, sugar: 3 }, serving: 250, unit: "ml" },
  { name: "Coffee (black)", emoji: "☕", per100: { calories: 2, protein: 0.3, carbs: 0, fiber: 0, sugar: 0 }, serving: 200, unit: "ml" },
  { name: "Tea (with milk & sugar)", emoji: "🍵", per100: { calories: 40, protein: 1.5, carbs: 6, fiber: 0, sugar: 5 }, serving: 150, unit: "ml" },
  { name: "Soft drink", emoji: "🥤", per100: { calories: 42, protein: 0, carbs: 10.6, fiber: 0, sugar: 10.6 }, serving: 330, unit: "ml" },
  { name: "Energy drink", emoji: "⚡", per100: { calories: 45, protein: 0, carbs: 11, fiber: 0, sugar: 11 }, serving: 250, unit: "ml" },
  { name: "Kheer", emoji: "🍮", per100: { calories: 120, protein: 4, carbs: 20, fiber: 0.5, sugar: 15 }, serving: 150, unit: "ml" },

  // Sweets & desserts
  { name: "Gulab jamun", emoji: "🍩", per100: { calories: 330, protein: 4, carbs: 50, fiber: 0.5, sugar: 40 }, serving: 50 },
  { name: "Jalebi", emoji: "🍥", per100: { calories: 380, protein: 3, carbs: 80, fiber: 0.5, sugar: 55 }, serving: 50 },
  { name: "Rasgulla", emoji: "🍡", per100: { calories: 150, protein: 4, carbs: 30, fiber: 0, sugar: 25 }, serving: 50 },
  { name: "Ladoo", emoji: "🍬", per100: { calories: 380, protein: 5, carbs: 55, fiber: 2, sugar: 35 }, serving: 40 },
  { name: "Barfi", emoji: "🍬", per100: { calories: 360, protein: 6, carbs: 50, fiber: 1, sugar: 40 }, serving: 40 },
  { name: "Halwa", emoji: "🍮", per100: { calories: 280, protein: 3, carbs: 45, fiber: 2, sugar: 25 }, serving: 100 },
  { name: "Dark chocolate", emoji: "🍫", per100: { calories: 546, protein: 4.9, carbs: 61, fiber: 7, sugar: 48 }, serving: 25 },
  { name: "Milk chocolate", emoji: "🍫", per100: { calories: 535, protein: 7, carbs: 59, fiber: 3, sugar: 52 }, serving: 25 },
  { name: "Ice cream", emoji: "🍦", per100: { calories: 207, protein: 3.5, carbs: 24, fiber: 0.5, sugar: 21 }, serving: 100, unit: "ml" },

  // Cookies & biscuits
  { name: "Chocolate chip cookie", emoji: "🍪", per100: { calories: 488, protein: 5, carbs: 64, fiber: 2, sugar: 35 }, serving: 30 },
  { name: "Oatmeal cookie", emoji: "🍪", per100: { calories: 450, protein: 6, carbs: 68, fiber: 4, sugar: 28 }, serving: 30 },
  { name: "Digestive biscuit", emoji: "🍪", per100: { calories: 465, protein: 7, carbs: 68, fiber: 4, sugar: 20 }, serving: 20 },
  { name: "Marie biscuit", emoji: "🍪", per100: { calories: 450, protein: 7, carbs: 70, fiber: 2, sugar: 22 }, serving: 20 },
  { name: "Oreo", emoji: "🍪", per100: { calories: 480, protein: 5, carbs: 71, fiber: 3, sugar: 38 }, serving: 20 },
  { name: "Butter cookie", emoji: "🍪", per100: { calories: 520, protein: 5, carbs: 62, fiber: 1, sugar: 30 }, serving: 20 },
  { name: "Almond cookie", emoji: "🍪", per100: { calories: 490, protein: 7, carbs: 60, fiber: 3, sugar: 28 }, serving: 20 },
  { name: "Coconut cookie", emoji: "🍪", per100: { calories: 470, protein: 4, carbs: 65, fiber: 3, sugar: 30 }, serving: 20 },
  { name: "Peanut butter cookie", emoji: "🍪", per100: { calories: 510, protein: 8, carbs: 58, fiber: 3, sugar: 26 }, serving: 25 },
  { name: "Shortbread cookie", emoji: "🍪", per100: { calories: 500, protein: 4, carbs: 62, fiber: 1, sugar: 22 }, serving: 20 },
  { name: "Nankhatai", emoji: "🍪", per100: { calories: 460, protein: 6, carbs: 64, fiber: 2, sugar: 24 }, serving: 20 },
  { name: "Biscotti", emoji: "🍪", per100: { calories: 430, protein: 7, carbs: 70, fiber: 3, sugar: 25 }, serving: 20 },
  { name: "Gingerbread cookie", emoji: "🍪", per100: { calories: 450, protein: 4, carbs: 70, fiber: 1, sugar: 30 }, serving: 25 },
  { name: "Snickerdoodle", emoji: "🍪", per100: { calories: 470, protein: 5, carbs: 66, fiber: 1, sugar: 32 }, serving: 25 },
  { name: "Sugar cookie", emoji: "🍪", per100: { calories: 480, protein: 4, carbs: 70, fiber: 0.5, sugar: 36 }, serving: 20 },
  { name: "Macaron", emoji: "🍪", per100: { calories: 380, protein: 6, carbs: 72, fiber: 1, sugar: 50 }, serving: 15 },

  // Chips, crisps & savory snacks
  { name: "Potato chips", emoji: "🥔", per100: { calories: 536, protein: 7, carbs: 53, fiber: 4, sugar: 0 }, serving: 50 },
  { name: "Banana chips", emoji: "🍌", per100: { calories: 519, protein: 2, carbs: 58, fiber: 4, sugar: 35 }, serving: 50 },
  { name: "Cassava chips", emoji: "🍠", per100: { calories: 500, protein: 1, carbs: 63, fiber: 4, sugar: 0 }, serving: 50 },
  { name: "Tortilla chips", emoji: "🌽", per100: { calories: 501, protein: 6, carbs: 65, fiber: 5, sugar: 1 }, serving: 50 },
  { name: "Masala chips", emoji: "🥔", per100: { calories: 540, protein: 7, carbs: 53, fiber: 4, sugar: 1 }, serving: 50 },
  { name: "Salted chips", emoji: "🥔", per100: { calories: 536, protein: 7, carbs: 53, fiber: 4, sugar: 0 }, serving: 50 },
  { name: "Cheetos", emoji: "🧀", per100: { calories: 530, protein: 6, carbs: 55, fiber: 2, sugar: 2 }, serving: 50 },
  { name: "Kurkure", emoji: "🌽", per100: { calories: 520, protein: 5, carbs: 58, fiber: 3, sugar: 1 }, serving: 50 },
  { name: "Lays", emoji: "🥔", per100: { calories: 536, protein: 7, carbs: 53, fiber: 4, sugar: 0 }, serving: 50 },
  { name: "Pringles", emoji: "🥔", per100: { calories: 520, protein: 4, carbs: 55, fiber: 2, sugar: 1 }, serving: 50 },
  { name: "Wafers", emoji: "🥔", per100: { calories: 510, protein: 5, carbs: 58, fiber: 2, sugar: 2 }, serving: 50 },
  { name: "Namkeen", emoji: "🍿", per100: { calories: 500, protein: 8, carbs: 55, fiber: 4, sugar: 2 }, serving: 50 },
  { name: "Bhujia", emoji: "🍿", per100: { calories: 560, protein: 12, carbs: 45, fiber: 5, sugar: 1 }, serving: 50 },
  { name: "Sev", emoji: "🍿", per100: { calories: 540, protein: 10, carbs: 48, fiber: 4, sugar: 1 }, serving: 50 },
  { name: "Masala peanuts", emoji: "🥜", per100: { calories: 560, protein: 18, carbs: 28, fiber: 6, sugar: 4 }, serving: 50 },
  { name: "Roasted makhana", emoji: "🍿", per100: { calories: 350, protein: 8, carbs: 70, fiber: 6, sugar: 0 }, serving: 30 },

  // Protein & supplements
  { name: "Whey protein 30g", emoji: "💪", per100: { calories: 400, protein: 80, carbs: 8, fiber: 0, sugar: 4 }, serving: 30 },
  { name: "Whey protein scoop", emoji: "💪", per100: { calories: 400, protein: 80, carbs: 8, fiber: 0, sugar: 4 }, serving: 30 },
  { name: "Casein protein", emoji: "💪", per100: { calories: 370, protein: 75, carbs: 6, fiber: 0, sugar: 3 }, serving: 30 },
  { name: "Mass gainer scoop", emoji: "💪", per100: { calories: 380, protein: 25, carbs: 70, fiber: 2, sugar: 15 }, serving: 100 },
  { name: "Creatine monohydrate", emoji: "⚡", per100: { calories: 0, protein: 0, carbs: 0, fiber: 0, sugar: 0 }, serving: 5 },
  { name: "BCAA powder", emoji: "⚡", per100: { calories: 20, protein: 5, carbs: 0, fiber: 0, sugar: 0 }, serving: 10 },

  // Sprouts
  { name: "Moong sprouts", emoji: "🌱", per100: { calories: 30, protein: 3, carbs: 5, fiber: 2, sugar: 0 }, serving: 100 },
  { name: "Green gram sprouts", emoji: "🌱", per100: { calories: 30, protein: 3, carbs: 5, fiber: 2, sugar: 0 }, serving: 100 },
  { name: "Chana sprouts", emoji: "🌱", per100: { calories: 35, protein: 4, carbs: 5, fiber: 2, sugar: 0 }, serving: 100 },
  { name: "Black gram sprouts", emoji: "🌱", per100: { calories: 32, protein: 3.5, carbs: 5, fiber: 2, sugar: 0 }, serving: 100 },
  { name: "Mixed sprouts", emoji: "🌱", per100: { calories: 33, protein: 3.5, carbs: 5, fiber: 2.5, sugar: 0 }, serving: 100 },
  { name: "Alfalfa sprouts", emoji: "🌿", per100: { calories: 23, protein: 4, carbs: 2, fiber: 2, sugar: 0 }, serving: 100 },
  { name: "Broccoli sprouts", emoji: "🥦", per100: { calories: 35, protein: 3, carbs: 4, fiber: 2, sugar: 0 }, serving: 100 },
  { name: "Fenugreek sprouts", emoji: "🌿", per100: { calories: 30, protein: 3, carbs: 5, fiber: 2, sugar: 0 }, serving: 100 },
  { name: "Horse gram sprouts", emoji: "🌱", per100: { calories: 38, protein: 4.5, carbs: 5, fiber: 2, sugar: 0 }, serving: 100 },
  { name: "Sprouted moth beans", emoji: "🌱", per100: { calories: 36, protein: 4, carbs: 5, fiber: 2, sugar: 0 }, serving: 100 },

  // Fruits & nuts
  { name: "Banana", emoji: "🍌", per100: { calories: 89, protein: 1.1, carbs: 23, fiber: 2.6, sugar: 12 }, serving: 120 },
  { name: "Apple", emoji: "🍎", per100: { calories: 52, protein: 0.3, carbs: 14, fiber: 2.4, sugar: 10 }, serving: 180 },
  { name: "Almonds", emoji: "🌰", per100: { calories: 579, protein: 21, carbs: 22, fiber: 12, sugar: 4.4 }, serving: 28 },
  { name: "Peanut butter", emoji: "🥜", per100: { calories: 588, protein: 25, carbs: 20, fiber: 6, sugar: 9 }, serving: 16 },
  { name: "Peanuts", emoji: "🥜", per100: { calories: 567, protein: 26, carbs: 16, fiber: 8, sugar: 4 }, serving: 28 },
  { name: "Walnuts", emoji: "🌰", per100: { calories: 654, protein: 15, carbs: 14, fiber: 7, sugar: 2.6 }, serving: 28 },
  { name: "Cashews", emoji: "🌰", per100: { calories: 553, protein: 18, carbs: 30, fiber: 3, sugar: 5 }, serving: 28 },
  { name: "Mixed vegetables (cooked)", emoji: "🥦", per100: { calories: 65, protein: 3, carbs: 11, fiber: 4, sugar: 4 }, serving: 150 },
  { name: "Salad (mixed)", emoji: "🥗", per100: { calories: 30, protein: 1.5, carbs: 5, fiber: 2, sugar: 2.5 }, serving: 150 },

  // Mutton & lamb dishes
  { name: "Mutton curry", emoji: "🍖", per100: { calories: 220, protein: 20, carbs: 6, fiber: 1, sugar: 2 }, serving: 200 },
  { name: "Mutton biryani", emoji: "🍛", per100: { calories: 240, protein: 12, carbs: 26, fiber: 2, sugar: 2 }, serving: 250 },
  { name: "Mutton chukka", emoji: "🍖", per100: { calories: 260, protein: 24, carbs: 5, fiber: 1, sugar: 1 }, serving: 150 },
  { name: "Mutton pepper fry", emoji: "🍖", per100: { calories: 275, protein: 25, carbs: 4, fiber: 1, sugar: 1 }, serving: 150 },
  { name: "Mutton kheema", emoji: "🍖", per100: { calories: 245, protein: 22, carbs: 5, fiber: 1, sugar: 2 }, serving: 200 },
  { name: "Mutton chops", emoji: "🍖", per100: { calories: 295, protein: 25, carbs: 2, fiber: 0, sugar: 0 }, serving: 150 },
  { name: "Mutton kola urundai", emoji: "🍖", per100: { calories: 260, protein: 22, carbs: 6, fiber: 1, sugar: 1 }, serving: 100 },
  { name: "Mutton sukka", emoji: "🍖", per100: { calories: 265, protein: 25, carbs: 4, fiber: 1, sugar: 1 }, serving: 150 },
  { name: "Mutton paya (soup)", emoji: "🍲", per100: { calories: 130, protein: 12, carbs: 3, fiber: 0.5, sugar: 1 }, serving: 250 },
  { name: "Mutton bone broth", emoji: "🍲", per100: { calories: 60, protein: 8, carbs: 1, fiber: 0, sugar: 0 }, serving: 250, unit: "ml" },
  { name: "Rogan josh (mutton)", emoji: "🍲", per100: { calories: 210, protein: 20, carbs: 5, fiber: 1, sugar: 2 }, serving: 200 },
  { name: "Mutton keema pav", emoji: "🍔", per100: { calories: 250, protein: 14, carbs: 25, fiber: 2, sugar: 3 }, serving: 200 },
  { name: "Lamb kebab", emoji: "🍢", per100: { calories: 240, protein: 22, carbs: 3, fiber: 0.5, sugar: 1 }, serving: 120 },
  { name: "Seekh kebab", emoji: "🍢", per100: { calories: 260, protein: 20, carbs: 5, fiber: 1, sugar: 1 }, serving: 120 },

  // Soft drinks & sodas
  { name: "Coke (Coca-Cola)", emoji: "🥤", per100: { calories: 42, protein: 0, carbs: 10.6, fiber: 0, sugar: 10.6 }, serving: 330, unit: "ml" },
  { name: "Diet Coke", emoji: "🥤", per100: { calories: 0, protein: 0, carbs: 0, fiber: 0, sugar: 0 }, serving: 330, unit: "ml" },
  { name: "Coke Zero", emoji: "🥤", per100: { calories: 0, protein: 0, carbs: 0, fiber: 0, sugar: 0 }, serving: 330, unit: "ml" },
  { name: "Pepsi", emoji: "🥤", per100: { calories: 44, protein: 0, carbs: 11, fiber: 0, sugar: 11 }, serving: 330, unit: "ml" },
  { name: "Sprite", emoji: "🥤", per100: { calories: 39, protein: 0, carbs: 9.6, fiber: 0, sugar: 9.6 }, serving: 330, unit: "ml" },
  { name: "Fanta", emoji: "🥤", per100: { calories: 44, protein: 0, carbs: 11, fiber: 0, sugar: 11 }, serving: 330, unit: "ml" },
  { name: "Thums Up", emoji: "🥤", per100: { calories: 46, protein: 0, carbs: 11.5, fiber: 0, sugar: 11.5 }, serving: 330, unit: "ml" },
  { name: "Limca", emoji: "🥤", per100: { calories: 40, protein: 0, carbs: 10, fiber: 0, sugar: 10 }, serving: 330, unit: "ml" },
  { name: "Mountain Dew", emoji: "🥤", per100: { calories: 46, protein: 0, carbs: 12, fiber: 0, sugar: 12 }, serving: 330, unit: "ml" },
  { name: "7 Up", emoji: "🥤", per100: { calories: 41, protein: 0, carbs: 10, fiber: 0, sugar: 10 }, serving: 330, unit: "ml" },

  // Coffees
  { name: "Filter coffee (South Indian)", emoji: "☕", per100: { calories: 55, protein: 1.5, carbs: 8, fiber: 0, sugar: 7 }, serving: 150, unit: "ml" },
  { name: "Cappuccino", emoji: "☕", per100: { calories: 55, protein: 3, carbs: 5, fiber: 0, sugar: 5 }, serving: 200, unit: "ml" },
  { name: "Latte", emoji: "☕", per100: { calories: 60, protein: 3, carbs: 5, fiber: 0, sugar: 5 }, serving: 240, unit: "ml" },
  { name: "Espresso", emoji: "☕", per100: { calories: 9, protein: 0.1, carbs: 1.7, fiber: 0, sugar: 0 }, serving: 30, unit: "ml" },
  { name: "Americano", emoji: "☕", per100: { calories: 4, protein: 0.2, carbs: 0.5, fiber: 0, sugar: 0 }, serving: 200, unit: "ml" },
  { name: "Mocha", emoji: "☕", per100: { calories: 95, protein: 3, carbs: 12, fiber: 0.5, sugar: 11 }, serving: 240, unit: "ml" },
  { name: "Flat white", emoji: "☕", per100: { calories: 65, protein: 3.5, carbs: 5.5, fiber: 0, sugar: 5.5 }, serving: 180, unit: "ml" },
  { name: "Cold coffee", emoji: "🥤", per100: { calories: 90, protein: 2.5, carbs: 14, fiber: 0, sugar: 13 }, serving: 250, unit: "ml" },
  { name: "Frappuccino", emoji: "🥤", per100: { calories: 130, protein: 2, carbs: 22, fiber: 0, sugar: 20 }, serving: 350, unit: "ml" },

  // Cakes & pastries
  { name: "Chocolate cake", emoji: "🍰", per100: { calories: 371, protein: 4, carbs: 51, fiber: 2, sugar: 36 }, serving: 100 },
  { name: "Vanilla cake", emoji: "🍰", per100: { calories: 305, protein: 4, carbs: 50, fiber: 0.5, sugar: 30 }, serving: 100 },
  { name: "Red velvet cake", emoji: "🍰", per100: { calories: 380, protein: 4, carbs: 52, fiber: 1, sugar: 38 }, serving: 100 },
  { name: "Black forest cake", emoji: "🍰", per100: { calories: 350, protein: 4, carbs: 45, fiber: 2, sugar: 33 }, serving: 100 },
  { name: "Cheesecake", emoji: "🍰", per100: { calories: 321, protein: 6, carbs: 26, fiber: 0.5, sugar: 22 }, serving: 100 },
  { name: "Brownie", emoji: "🍫", per100: { calories: 466, protein: 6, carbs: 60, fiber: 3, sugar: 45 }, serving: 60 },
  { name: "Cupcake", emoji: "🧁", per100: { calories: 360, protein: 4, carbs: 55, fiber: 1, sugar: 40 }, serving: 60 },
  { name: "Donut", emoji: "🍩", per100: { calories: 452, protein: 5, carbs: 51, fiber: 1.5, sugar: 23 }, serving: 60 },
  { name: "Croissant", emoji: "🥐", per100: { calories: 406, protein: 8, carbs: 46, fiber: 3, sugar: 11 }, serving: 60 },
  { name: "Muffin", emoji: "🧁", per100: { calories: 377, protein: 6, carbs: 55, fiber: 2, sugar: 25 }, serving: 80 },
  { name: "Pastry (cream)", emoji: "🥮", per100: { calories: 400, protein: 5, carbs: 45, fiber: 1, sugar: 30 }, serving: 80 },
  { name: "Tiramisu", emoji: "🍰", per100: { calories: 340, protein: 6, carbs: 30, fiber: 0.5, sugar: 24 }, serving: 100 },

  // Ice creams
  { name: "Ice cream sundae", emoji: "🍨", per100: { calories: 240, protein: 4, carbs: 32, fiber: 1, sugar: 26 }, serving: 200 },
  { name: "Chocolate sundae", emoji: "🍨", per100: { calories: 260, protein: 4, carbs: 34, fiber: 1, sugar: 28 }, serving: 200 },
  { name: "Hot fudge sundae", emoji: "🍨", per100: { calories: 285, protein: 5, carbs: 38, fiber: 1, sugar: 30 }, serving: 200 },
  { name: "Vanilla ice cream", emoji: "🍦", per100: { calories: 207, protein: 3.5, carbs: 24, fiber: 0.5, sugar: 21 }, serving: 100 },
  { name: "Chocolate ice cream", emoji: "🍦", per100: { calories: 216, protein: 4, carbs: 28, fiber: 1, sugar: 25 }, serving: 100 },
  { name: "Strawberry ice cream", emoji: "🍦", per100: { calories: 192, protein: 3, carbs: 27, fiber: 0.5, sugar: 24 }, serving: 100 },
  { name: "Butterscotch ice cream", emoji: "🍦", per100: { calories: 220, protein: 3.5, carbs: 30, fiber: 0.5, sugar: 26 }, serving: 100 },
  { name: "Mango kulfi", emoji: "🍧", per100: { calories: 200, protein: 4, carbs: 28, fiber: 0.5, sugar: 25 }, serving: 80 },
  { name: "Kulfi (malai)", emoji: "🍧", per100: { calories: 220, protein: 5, carbs: 24, fiber: 0, sugar: 22 }, serving: 80 },
  { name: "Falooda", emoji: "🥤", per100: { calories: 160, protein: 3, carbs: 26, fiber: 0.5, sugar: 20 }, serving: 250 },
  { name: "Milkshake (chocolate)", emoji: "🥤", per100: { calories: 112, protein: 3, carbs: 18, fiber: 0.5, sugar: 17 }, serving: 300, unit: "ml" },

  // Steamed rice varieties & rice mixes (Tamil Nadu)
  { name: "Steamed rice (ponni)", emoji: "🍚", per100: { calories: 130, protein: 2.7, carbs: 28, fiber: 0.4, sugar: 0.1 }, serving: 200 },
  { name: "Steamed rice (basmati)", emoji: "🍚", per100: { calories: 121, protein: 3, carbs: 26, fiber: 0.5, sugar: 0.1 }, serving: 200 },
  { name: "Steamed rice (sona masoori)", emoji: "🍚", per100: { calories: 130, protein: 2.7, carbs: 28, fiber: 0.4, sugar: 0.1 }, serving: 200 },
  { name: "Boiled rice (idli rice)", emoji: "🍚", per100: { calories: 128, protein: 2.5, carbs: 28, fiber: 0.5, sugar: 0.1 }, serving: 200 },
  { name: "Steamed brown rice", emoji: "🍙", per100: { calories: 123, protein: 2.7, carbs: 26, fiber: 1.8, sugar: 0.4 }, serving: 200 },
  { name: "Red rice (matta)", emoji: "🍚", per100: { calories: 135, protein: 3, carbs: 27, fiber: 2, sugar: 0.3 }, serving: 200 },
  { name: "Hand pounded rice", emoji: "🍚", per100: { calories: 128, protein: 3, carbs: 27, fiber: 1.5, sugar: 0.2 }, serving: 200 },
  { name: "Sambar rice", emoji: "🍛", per100: { calories: 140, protein: 5, carbs: 24, fiber: 3, sugar: 2 }, serving: 250 },
  { name: "Bisi bele bath", emoji: "🍛", per100: { calories: 165, protein: 6, carbs: 26, fiber: 3, sugar: 2 }, serving: 250 },
  { name: "Puliyodarai (tamarind rice)", emoji: "🍚", per100: { calories: 170, protein: 3, carbs: 35, fiber: 2, sugar: 2 }, serving: 200 },
  { name: "Coconut rice", emoji: "🍚", per100: { calories: 180, protein: 3, carbs: 30, fiber: 2, sugar: 1 }, serving: 200 },
  { name: "Curry leaf rice", emoji: "🍚", per100: { calories: 160, protein: 3, carbs: 30, fiber: 1.5, sugar: 1 }, serving: 200 },
  { name: "Ellu sadam (sesame rice)", emoji: "🍚", per100: { calories: 195, protein: 4, carbs: 30, fiber: 2, sugar: 1 }, serving: 200 },
  { name: "Ven pongal", emoji: "🥣", per100: { calories: 155, protein: 4, carbs: 28, fiber: 1, sugar: 0.5 }, serving: 200 },
  { name: "Sakkarai pongal", emoji: "🥣", per100: { calories: 210, protein: 3, carbs: 40, fiber: 1, sugar: 22 }, serving: 150 },
  { name: "Tomato rice", emoji: "🍅", per100: { calories: 160, protein: 3, carbs: 30, fiber: 1.5, sugar: 3 }, serving: 200 },
  { name: "Mint rice (pudina)", emoji: "🌿", per100: { calories: 165, protein: 3, carbs: 30, fiber: 1.5, sugar: 1 }, serving: 200 },
  { name: "Vegetable biryani (TN style)", emoji: "🍛", per100: { calories: 180, protein: 5, carbs: 30, fiber: 3, sugar: 2 }, serving: 250 },
  { name: "Chettinad chicken biryani", emoji: "🍛", per100: { calories: 220, protein: 12, carbs: 26, fiber: 2, sugar: 2 }, serving: 250 },

  // Tamil Nadu sides & dishes
  { name: "Chettinad chicken", emoji: "🍗", per100: { calories: 210, protein: 24, carbs: 5, fiber: 1, sugar: 1 }, serving: 150 },
  { name: "Chicken 65", emoji: "🍗", per100: { calories: 255, protein: 22, carbs: 8, fiber: 1, sugar: 1 }, serving: 150 },
  { name: "Chicken chukka", emoji: "🍗", per100: { calories: 245, protein: 24, carbs: 5, fiber: 1, sugar: 1 }, serving: 150 },
  { name: "Nethili fry (anchovy)", emoji: "🐟", per100: { calories: 220, protein: 22, carbs: 5, fiber: 0.5, sugar: 0 }, serving: 100 },
  { name: "Prawn masala", emoji: "🍤", p per100: { calories: 175, protein: 20, carbs: 5, fiber: 1, sugar: 2 }, serving: 150 },
  { name: "Prawn fry", emoji: "🍤", per100: { calories: 190, protein: 22, carbs: 3, fiber: 0.5, sugar: 1 }, serving: 150 },
  { name: "Crab masala", emoji: "🦀", per100: { calories: 165, protein: 18, carbs: 4, fiber: 0.5, sugar: 1 }, serving: 200 },
  { name: "Egg curry", emoji: "🍳", per100: { calories: 150, protein: 9, carbs: 6, fiber: 1, sugar: 3 }, serving: 200 },
  { name: "Egg podimas (bhurji)", emoji: "🍳", per100: { calories: 175, protein: 12, carbs: 3, fiber: 0.5, sugar: 1 }, serving: 100 },
  { name: "Kara kuzhambu", emoji: "🍲", per100: { calories: 95, protein: 3, carbs: 12, fiber: 3, sugar: 3 }, serving: 200 },
  { name: "Vatha kuzhambu", emoji: "🍲", per100: { calories: 100, protein: 3, carbs: 14, fiber: 3, sugar: 3 }, serving: 200 },
  { name: "Milagu kuzhambu", emoji: "🍲", per100: { calories: 90, protein: 3, carbs: 12, fiber: 3, sugar: 3 }, serving: 200 },
  { name: "Mor kuzhambu (buttermilk)", emoji: "🍲", per100: { calories: 85, protein: 3, carbs: 10, fiber: 2, sugar: 3 }, serving: 200 },
  { name: "Paruppu (dal) - TN style", emoji: "🍲", per100: { calories: 115, protein: 8, carbs: 20, fiber: 6, sugar: 2 }, serving: 200 },
  { name: "Keerai masiyal (spinach)", emoji: "🥬", per100: { calories: 55, protein: 3, carbs: 6, fiber: 3, sugar: 1 }, serving: 150 },
  { name: "Keerai kootu", emoji: "🥬", per100: { calories: 85, protein: 4, carbs: 10, fiber: 4, sugar: 2 }, serving: 150 },
  { name: "Beans poriyal", emoji: "🌱", per100: { calories: 70, protein: 3, carbs: 9, fiber: 4, sugar: 2 }, serving: 100 },
  { name: "Cabbage poriyal", emoji: "🥬", per100: { calories: 65, protein: 2, carbs: 8, fiber: 3, sugar: 3 }, serving: 100 },
  { name: "Carrot poriyal", emoji: "🥕", per100: { calories: 75, protein: 1.5, carbs: 10, fiber: 3, sugar: 5 }, serving: 100 },
  { name: "Beetroot poriyal", emoji: "🥬", per100: { calories: 80, protein: 2, carbs: 12, fiber: 3, sugar: 7 }, serving: 100 },
  { name: "Vazhaipoo (banana flower)", emoji: "🌸", per100: { calories: 95, protein: 4, carbs: 12, fiber: 5, sugar: 2 }, serving: 100 },
  { name: "Vazhakkai (raw banana)", emoji: "🍌", per100: { calories: 110, protein: 2, carbs: 22, fiber: 3, sugar: 5 }, serving: 100 },
  { name: "Urulai roast (potato)", emoji: "🥔", per100: { calories: 155, protein: 3, carbs: 22, fiber: 2, sugar: 1 }, serving: 100 },
  { name: "Sundal (chickpea)", emoji: "🫘", per100: { calories: 140, protein: 7, carbs: 22, fiber: 6, sugar: 2 }, serving: 100 },
  { name: "Kadala curry", emoji: "🫘", per100: { calories: 145, protein: 8, carbs: 22, fiber: 7, sugar: 2 }, serving: 200 },
  { name: "Idiyappam", emoji: "🍜", per100: { calories: 155, protein: 3, carbs: 34, fiber: 1, sugar: 0.5 }, serving: 100 },
  { name: "Kal dosa", emoji: "🥞", per100: { calories: 175, protein: 4, carbs: 32, fiber: 1, sugar: 1 }, serving: 80 },
  { name: "Set dosa", emoji: "🥞", per100: { calories: 180, protein: 4, carbs: 33, fiber: 1, sugar: 1 }, serving: 80 },
  { name: "Ghee roast dosa", emoji: "🥞", per100: { calories: 220, protein: 4, carbs: 32, fiber: 1, sugar: 1 }, serving: 100 },
  { name: "Aappam with stew", emoji: "🥞", per100: { calories: 170, protein: 4, carbs: 25, fiber: 1, sugar: 3 }, serving: 200 },
];


export type FoodEntry = {
  id: string;
  dateISO: string;
  name: string;
  emoji: string;
  grams: number;
  unit: "g" | "ml";
  macros: Macros; // computed totals for this entry
  createdAt: string;
};

export type Goal = {
  name: string;
  age: number;
  heightCm: number;
  currentKg: number;
  targetKg: number;
  goalType: "gain" | "maintain" | "lose";
  activity: number; // 1.2 sedentary..1.725 very active
};

const FOOD_KEY = "punch-food-entries-v1";
const GOAL_KEY = "punch-goal-v1";

export const DEFAULT_GOAL: Goal = {
  name: "",
  age: 0,
  heightCm: 175,
  currentKg: 65,
  targetKg: 72,
  goalType: "gain",
  activity: 1.55,
};


function loadEntries(): FoodEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FOOD_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveEntries(e: FoodEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FOOD_KEY, JSON.stringify(e));
}
function loadGoal(): Goal {
  if (typeof window === "undefined") return DEFAULT_GOAL;
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    if (!raw) return DEFAULT_GOAL;
    return { ...DEFAULT_GOAL, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GOAL;
  }
}
function saveGoal(g: Goal) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GOAL_KEY, JSON.stringify(g));
}

export function computeMacros(food: Food, qty: number): Macros {
  const f = qty / 100;
  return {
    calories: +(food.per100.calories * f).toFixed(1),
    protein: +(food.per100.protein * f).toFixed(1),
    carbs: +(food.per100.carbs * f).toFixed(1),
    fiber: +(food.per100.fiber * f).toFixed(1),
    sugar: +(food.per100.sugar * f).toFixed(1),
  };
}

export function emptyMacros(): Macros {
  return { calories: 0, protein: 0, carbs: 0, fiber: 0, sugar: 0 };
}

export function sumMacros(items: Macros[]): Macros {
  return items.reduce(
    (a, b) => ({
      calories: +(a.calories + b.calories).toFixed(1),
      protein: +(a.protein + b.protein).toFixed(1),
      carbs: +(a.carbs + b.carbs).toFixed(1),
      fiber: +(a.fiber + b.fiber).toFixed(1),
      sugar: +(a.sugar + b.sugar).toFixed(1),
    }),
    emptyMacros(),
  );
}

// Mifflin-St Jeor BMR (assuming male)
export function computeTargets(g: Goal) {
  const bmr = 10 * g.currentKg + 6.25 * g.heightCm - 5 * g.age + 5;
  const tdee = bmr * g.activity;
  const adjust = g.goalType === "gain" ? 400 : g.goalType === "lose" ? -400 : 0;
  const calories = Math.round(tdee + adjust);
  // Protein 1.8 g per kg of target weight for gain, 2.0 for lose, 1.6 maintain
  const proteinPerKg = g.goalType === "gain" ? 1.8 : g.goalType === "lose" ? 2.0 : 1.6;
  const protein = Math.round(g.targetKg * proteinPerKg);
  // Carbs ~ 45-55% of calories, fiber ~ 30g, sugar limit ~ 50g
  const carbs = Math.round((calories * 0.5) / 4);
  const fiber = 30;
  const sugar = 50;
  return { calories, protein, carbs, fiber, sugar, bmr: Math.round(bmr), tdee: Math.round(tdee) };
}

export function useGoal() {
  const [goal, setGoal] = useState<Goal>(DEFAULT_GOAL);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setGoal(loadGoal());
    setLoaded(true);
  }, []);
  const update = useCallback((patch: Partial<Goal>) => {
    setGoal((prev) => {
      const next = { ...prev, ...patch };
      saveGoal(next);
      return next;
    });
  }, []);
  return { goal, loaded, update };
}

export function useFoodEntries() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setEntries(loadEntries());
    setLoaded(true);
  }, []);

  const add = useCallback((entry: Omit<FoodEntry, "id" | "createdAt">) => {
    const e: FoodEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const next = [...loadEntries(), e];
    saveEntries(next);
    setEntries(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = loadEntries().filter((e) => e.id !== id);
    saveEntries(next);
    setEntries(next);
  }, []);

  return { entries, loaded, add, remove };
}

export function entriesForDate(entries: FoodEntry[], dateISO: string) {
  return entries.filter((e) => e.dateISO === dateISO);
}

export function dailyTotals(entries: FoodEntry[], dateISO: string): Macros {
  return sumMacros(entriesForDate(entries, dateISO).map((e) => e.macros));
}

export function nutritionStats(entries: FoodEntry[], days: number) {
  const today = new Date();
  const perDay: { date: string; macros: Macros }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const iso = toISO(d);
    perDay.push({ date: iso, macros: dailyTotals(entries, iso) });
  }
  const total = sumMacros(perDay.map((p) => p.macros));
  const avg: Macros = {
    calories: +(total.calories / days).toFixed(0),
    protein: +(total.protein / days).toFixed(1),
    carbs: +(total.carbs / days).toFixed(1),
    fiber: +(total.fiber / days).toFixed(1),
    sugar: +(total.sugar / days).toFixed(1),
  };
  return { perDay, total, avg };
}

export { todayISO, toISO, fromISO, addDays };
