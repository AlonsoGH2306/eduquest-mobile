export interface WeatherDescription {
  label: string;
  icon: string;
  studyTip: string;
}

const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];
const STORM_CODES = [95, 96, 99];
const FOG_CODES = [45, 48];
const CLOUD_CODES = [2, 3];

export const describeWeather = (code: number, isDay: boolean, temperature: number): WeatherDescription => {
  if (STORM_CODES.includes(code)) {
    return {
      label: 'Tormenta',
      icon: 'weather-lightning-rainy',
      studyTip: 'Quédate bajo techo: buen momento para una sesión larga de enfoque.',
    };
  }
  if (RAIN_CODES.includes(code)) {
    return {
      label: 'Lluvia',
      icon: 'weather-rainy',
      studyTip: 'Día de lluvia: ideal para repasar apuntes con un café.',
    };
  }
  if (FOG_CODES.includes(code)) {
    return {
      label: 'Neblina',
      icon: 'weather-fog',
      studyTip: 'Neblina afuera: arranca con lo más difícil mientras estás fresco.',
    };
  }
  if (CLOUD_CODES.includes(code)) {
    return {
      label: 'Nublado',
      icon: isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy',
      studyTip: 'Cielo nublado: luz pareja para leer sin cansar la vista.',
    };
  }
  if (!isDay) {
    return {
      label: 'Despejado',
      icon: 'weather-night',
      studyTip: 'Ya es de noche: repasa lo del día y deja el tema nuevo para mañana.',
    };
  }
  return {
    label: code === 1 ? 'Mayormente despejado' : 'Despejado',
    icon: 'weather-sunny',
    studyTip:
      temperature >= 26
        ? 'Hace calor: hidrátate y estudia en bloques cortos.'
        : 'Buen clima: en tu descanso sal a caminar cinco minutos.',
  };
};
