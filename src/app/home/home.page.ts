import { Component, OnInit } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  // Variables relacionadas con el titulo
  currentDate: Date;
  currentTime: Date;
  nuevaFecha: string = '';
  // Variables relacionadas con el costo del viaje
  costo_viaje: number = 0;
  cobroPorTiempo: boolean = false;
  cobroPorDistancia: boolean = false;
  tarifa: number = 0;
  aumento: number = 0;
  isDay: boolean = false;
  // Variables relacionadas con la ubicacion
  viajeIniciado: boolean = false;
  viajeTerminado: boolean = false;
  ubicacionActivada: boolean = false;
  interval: any;
  intervalDistance: any;
  positionInterval: any;
  currentLatitude: number = 0;
  currentLongitude: number = 0;
  lastLatitude: number = 0;
  lastLongitude: number = 0;
  lastDistance: number = 0;
  lastUpdateTime: number = 0;
  currentSpeed: number = 0;
  // Variable relacionada con radio button
  radioButtonsDisabled: boolean = true;
  taxiSelected: string | null = null;
  // Variables relacionadas con el tiempo del recorrido
  tiempoInicial: Date | null = null;
  tiempoFinal: Date | null = null;
  duracionRecorrido: number | null = null;
  tiempoRecorrido: string = '';
  //Variables relacionadas con la distancia del recorrido
  inicioLatitude: number = 0;
  inicioLongitude: number = 0;
  finLatitude: number = 0;
  finLongitude: number = 0;
  distanciaRecorrida: number = 0;
  velocidad: number = 0;

  constructor() {
    this.currentDate = new Date();
    this.currentTime = new Date();
    this.nuevaFecha = this.convertirFecha(this.currentDate);
  }

  onRadioSelect() {
    console.log('Opción seleccionada:', this.taxiSelected);

    // Si se seleccionó un radio button y el viaje ya ha sido iniciado
    if (this.taxiSelected && this.viajeIniciado) {
      this.radioButtonsDisabled = true;
    }
  }

  convertirFecha(fecha: Date): string {
    return (
      this.convertirDia(fecha.getDay().toString()) +
      ',' +
      fecha.getDate() +
      ' ' +
      this.convertirMes(fecha.getMonth().toString()) +
      ' ' +
      fecha.getFullYear()
    );
  }

  async ngOnInit() {
    // Show the splash for two seconds and then automatically hide it:
    await SplashScreen.show({
      showDuration: 2000,
      autoHide: true,
    });

    this.checkUbicacionActivada();
    this.showCurrentDate();
  }

  checkUbicacionActivada() {
    Geolocation.getCurrentPosition().then(
      (position: Position): void => {
        this.ubicacionActivada = true;
      },
      (error) => {
        this.ubicacionActivada = false;
        // this.turnOnLocation();
      }
    );
  }

  iniciarViaje() {
    this.viajeIniciado = true;
    this.viajeTerminado = false;

    const currentHour = this.currentTime.getHours();
    // const tarifa = currentHour >= 5 && currentHour < 22 ? 8.74 : 10.48;

    if (this.taxiSelected === 'libre') {
      this.tarifa = currentHour >= 5 && currentHour < 22 ? 8.74 : 10.48;
      this.aumento = currentHour >= 5 && currentHour < 22 ? 1.07 : 1.28;
    } else if (this.taxiSelected === 'sitio') {
      this.tarifa = currentHour >= 5 && currentHour < 22 ? 13.1 : 15.72;
      this.aumento = currentHour >= 5 && currentHour < 22 ? 1.3 : 1.56;
    } else if (this.taxiSelected === 'radio_taxi') {
      this.tarifa = currentHour >= 5 && currentHour < 22 ? 27.3 : 32.76;
      this.aumento = currentHour >= 5 && currentHour < 22 ? 1.84 : 2.21;
    }
    this.costo_viaje = this.tarifa;
    this.tiempoInicial = new Date();

    this.inicioLatitude = this.currentLatitude;
    this.inicioLongitude = this.currentLongitude;

    this.iniciarTimers();
    this.calcularVelocidad();
  }

  tipoTarifa(): boolean {
    const currentHour = this.currentTime.getHours();
    return currentHour >= 5 && currentHour < 22 ? (this.isDay = true) : false;
  }

  iniciarTimers() {
    this.interval = setInterval(() => {
      this.actualizarCostoPorTiempo();
    }, 45000);

    this.positionInterval = setInterval(() => {
      this.checkUbicacionActivada();
      this.actualizarCostoPorDistancia();
    }, 10000);
  }

  terminarViaje() {
    clearInterval(this.interval);
    clearInterval(this.intervalDistance);
    clearInterval(this.positionInterval);
    this.viajeIniciado = false;
    this.viajeTerminado = true;

    this.tiempoViaje();

    this.finLatitude = this.currentLatitude;
    this.finLongitude = this.currentLongitude;

    // this.calcularDistanciaRecorrida();
  }

  tiempoViaje() {
    this.tiempoFinal = new Date();

    if (this.tiempoInicial != null) {
      this.duracionRecorrido =
        this.tiempoFinal.getTime() - this.tiempoInicial.getTime();

      const duracionEnSegundos = this.duracionRecorrido / 1000;
      const horas = Math.floor(duracionEnSegundos / 3600);
      const minutos = Math.floor((duracionEnSegundos % 3600) / 60);
      const segundos = Math.floor(duracionEnSegundos % 60);

      const horasFormateadas = horas.toString().padStart(2, '0');
      const minutosFormateados = minutos.toString().padStart(2, '0');
      const segundosFormateados = segundos.toString().padStart(2, '0');

      this.tiempoRecorrido =
        horasFormateadas + ':' + minutosFormateados + ':' + segundosFormateados;
      console.log(
        horasFormateadas + ':' + minutosFormateados + ':' + segundosFormateados
      );
    }
  }

  getCurrentPosition() {
    Geolocation.getCurrentPosition().then(
      (position: Position) => {
        const newLatitude = position.coords.latitude;
        const newLongitude = position.coords.longitude;

        /* this.latitude = newLatitude;
        this.longitude = newLongitude; */
        this.lastLatitude = this.currentLatitude;
        this.lastLongitude = this.currentLongitude;
        this.currentLatitude = newLatitude;
        this.currentLongitude = newLongitude;
      },
      (error) => {
        console.log('no se pudo obtener la ubicacion');
      }
    );
  }

  calcularDistancia(
    lastLat1: number,
    lastLon1: number,
    currLat2: number,
    currLon2: number
  ): number {
    if (lastLat1 !== 0 && lastLon1! !== 0) {
      const R = 6371; // Radio de la Tierra en kilómetros
      const dLat = this.degToRad(currLat2 - lastLat1);
      const dLon = this.degToRad(currLon2 - lastLon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.degToRad(lastLat1)) *
          Math.cos(this.degToRad(currLat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distancia = R * c * 1000; // Distancia en metros

      return distancia;
    } else {
      return 0;
    }
  }

  degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  obtenerTiempo(): number {
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - this.lastUpdateTime;

    return elapsedTime;
  }

  actualizarCostoPorTiempo() {
    const currentHour = this.currentTime.getHours();
    const elTi = this.obtenerTiempo();

    if (elTi >= 44980) {
      if (this.taxiSelected === 'libre') {
        // this.tarifa = currentHour >= 5 && currentHour < 22 ? 8.74 : 10.48;
        this.aumento = currentHour >= 5 && currentHour < 22 ? 1.07 : 1.28;
      } else if (this.taxiSelected === 'sitio') {
        // this.tarifa = currentHour >= 5 && currentHour < 22 ? 13.1 : 15.72;
        this.aumento = currentHour >= 5 && currentHour < 22 ? 1.3 : 1.56;
      } else if (this.taxiSelected === 'radio_taxi') {
        // this.tarifa = currentHour >= 5 && currentHour < 22 ? 27.3 : 32.76;
        this.aumento = currentHour >= 5 && currentHour < 22 ? 1.84 : 2.21;
      }

      this.costo_viaje += this.aumento;
      this.cobroPorTiempo = true;
      this.cobroPorDistancia = false;
      clearInterval(this.interval);
      clearInterval(this.positionInterval);
      this.aumento = 0;
      this.iniciarTimers();
      this.lastUpdateTime = elTi;
    }
  }
  /*
  obtenerNumeroRandom(min: number, max: number): number {
    // const min = 240;
    // const max = 260;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
  }
 */
  calcularVelocidad() {
    this.intervalDistance = setInterval(() => {
      // const distancia = this.obtenerNumeroRandom(10, 120);
      this.velocidad = (this.lastDistance * 0.001) / 0.00028;
    }, 1000);
  }

  actualizarCostoPorDistancia() {
    this.getCurrentPosition();
    // this.calcularDistanciaRecorrida();
    /*
    const numeroRandom = this.obtenerNumeroRandom(240, 260);
    console.log(numeroRandom);
    this.lastDistance = numeroRandom;
 */
    const currentHour = this.currentTime.getHours();

    this.distanciaRecorrida += this.lastDistance;
    if (this.lastDistance >= 240) {
      if (this.taxiSelected === 'libre') {
        // this.tarifa = currentHour >= 5 && currentHour < 22 ? 8.74 : 10.48;
        this.aumento = currentHour >= 5 && currentHour < 22 ? 1.07 : 1.28;
      } else if (this.taxiSelected === 'sitio') {
        // this.tarifa = currentHour >= 5 && currentHour < 22 ? 13.1 : 15.72;
        this.aumento = currentHour >= 5 && currentHour < 22 ? 1.3 : 1.56;
      } else if (this.taxiSelected === 'radio_taxi') {
        // this.tarifa = currentHour >= 5 && currentHour < 22 ? 27.3 : 32.76;
        this.aumento = currentHour >= 5 && currentHour < 22 ? 1.84 : 2.21;
      }
      this.costo_viaje += this.aumento;
      this.cobroPorTiempo = false;
      this.cobroPorDistancia = true;
      clearInterval(this.interval);
      clearInterval(this.positionInterval);
      this.aumento = 0;
      this.iniciarTimers();
    }
  }

  calcularDistanciaRecorrida(): number {
    const distance = this.calcularDistancia(
      this.lastLatitude,
      this.lastLongitude,
      this.currentLatitude,
      this.currentLongitude
    );

    if (this.lastLatitude > 0 && this.lastLongitude > 0) {
      this.lastDistance = distance;
    }

    return Number(this.lastDistance.toFixed(2));
  }

  /*   async turnOnLocation() {
    const position: Position = await Geolocation.getCurrentPosition();
    console.log('Ubicación actual:', position);
  } */

  reiniciarTaximetro() {
    this.viajeIniciado = false;
    this.viajeTerminado = false;
    this.costo_viaje = 0;
    this.currentLatitude = 0;
    this.currentLongitude = 0;
    // this.distancia = true;
    this.lastLatitude = 0;
    this.lastLongitude = 0;
    this.lastUpdateTime = 0;
    this.lastDistance = 0;

    clearInterval(this.interval);
    clearInterval(this.intervalDistance);
    clearInterval(this.positionInterval);

    this.cobroPorTiempo = false;
    this.cobroPorDistancia = false;

    this.taxiSelected = null;
  }

  showCurrentDate() {
    // this.currentTime = new Date();
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  diasSemana: string[] = ['0', '1', '2', '3', '4', '5', '6'];
  diasSemanaEsp: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  mesesAnio: string[] = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
  ];
  mesesAnioEsp: string[] = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  convertirDia(nombreDia: string): string {
    let nuevoDia: string = '';
    // Ejemplo de uso
    for (let i = 0; i < this.diasSemana.length; i++) {
      if (nombreDia === this.diasSemana[i]) {
        nuevoDia = this.diasSemanaEsp[i];
      }
    }
    return nuevoDia;
  }

  convertirMes(nombreMes: string): string {
    let nuevoMes: string = '';
    // Ejemplo de uso
    for (let i = 0; i < this.mesesAnio.length; i++) {
      if (nombreMes === this.mesesAnio[i]) {
        nuevoMes = this.mesesAnioEsp[i];
      }
    }

    return nuevoMes;
  }

  formatTime(totalTime: number): string {
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const seconds = totalTime % 60;

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }
}
