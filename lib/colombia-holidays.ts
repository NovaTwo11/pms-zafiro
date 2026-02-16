import { addDays, getDate, getMonth, getYear, isMonday, nextMonday, setDate, setMonth, setYear, format } from "date-fns";

type Holiday = {
    dateStr: string; // Formato yyyy-MM-dd para búsqueda rápida
    name: string;
};

// Algoritmo de Gauss para Pascua
const getEaster = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed month
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
};

const getEmilianiDate = (date: Date): Date => {
    return isMonday(date) ? date : nextMonday(date);
};

export const getColombiaHolidays = (year: number): Record<string, string> => {
    const holidays: Record<string, string> = {};

    const add = (date: Date, name: string) => {
        holidays[format(date, "yyyy-MM-dd")] = name;
    };

    const addFixed = (month: number, day: number, name: string) => {
        add(new Date(year, month, day), name);
    };

    const addEmiliani = (month: number, day: number, name: string) => {
        add(getEmilianiDate(new Date(year, month, day)), name);
    };

    // 1. Fiestas fijas inamovibles
    addFixed(0, 1, "Año Nuevo");
    addFixed(4, 1, "Día del Trabajo");
    addFixed(6, 20, "Independencia de Colombia");
    addFixed(7, 7, "Batalla de Boyacá");
    addFixed(11, 8, "Inmaculada Concepción");
    addFixed(11, 25, "Navidad");

    // 2. Ley Emiliani (Se mueven al lunes siguiente)
    addEmiliani(0, 6, "Reyes Magos");
    addEmiliani(2, 19, "San José");
    addEmiliani(5, 29, "San Pedro y San Pablo");
    addEmiliani(7, 15, "Asunción de la Virgen");
    addEmiliani(9, 12, "Día de la Raza");
    addEmiliani(10, 1, "Todos los Santos");
    addEmiliani(10, 11, "Independencia de Cartagena");

    // 3. Relativos a la Pascua
    const easter = getEaster(year);

    // Semana Santa (Jueves y Viernes Santo) - Inamovibles relativos
    add(addDays(easter, -3), "Jueves Santo");
    add(addDays(easter, -2), "Viernes Santo");

    // Fiestas religiosas móviles (Ley Emiliani aplica + días desde pascua)
    // Ascensión (43 días después de Pascua, se celebra lunes siguiente -> 43 es jueves, +4 = 47)
    add(addDays(easter, 43), "Ascensión del Señor"); // El cálculo real es Domingo + 40, Ley traslada al Lunes.
    // En Colombia: Ascensión se celebra el lunes siguiente a los 40 días.
    // Cálculo exacto Emiliani: Pascua + 39 dias (Jueves) -> Lunes siguiente.
    add(getEmilianiDate(addDays(easter, 39)), "Ascensión del Señor");

    // Corpus Christi (Jueves + 60 días -> Lunes)
    add(getEmilianiDate(addDays(easter, 60)), "Corpus Christi");

    // Sagrado Corazón (Viernes + 68 días -> Lunes)
    add(getEmilianiDate(addDays(easter, 68)), "Sagrado Corazón");

    return holidays;
};