import { Component, OnInit } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';

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
  // Variables relacionadas con la ubicacion
  viajeIniciado: boolean = false;
  viajeTerminado: boolean = false;
  ubicacionActivada: boolean = false;
  interval: any;
  positionInterval: any;
  currentLatitude: number = 0;
  currentLongitude: number = 0;
  lastLatitude: number = 0;
  lastLongitude: number = 0;
  lastDistance: number = 0;
  lastUpdateTime: number = 0;

  constructor() {
    this.currentDate = new Date();
    this.currentTime = new Date();
    this.nuevaFecha = this.convertirFecha(this.currentDate);
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

  ngOnInit() {
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
    const tarifa = currentHour >= 5 && currentHour < 22 ? 8.74 : 10.48;

    this.costo_viaje = tarifa;

    this.iniciarTimers();
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
    this.viajeTerminado = true;
    this.viajeIniciado = false;

    clearInterval(this.interval);
    clearInterval(this.positionInterval);
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

  actualizarCostoPorTiempo() {
    const currentHour = this.currentTime.getHours();
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - this.lastUpdateTime;

    if (elapsedTime >= 44980) {
      this.costo_viaje += currentHour >= 5 && currentHour < 22 ? 1.07 : 1.28;
      this.cobroPorTiempo = true;
      this.cobroPorDistancia = false;
      clearInterval(this.interval);
      clearInterval(this.positionInterval);
      this.iniciarTimers();
    }
    this.lastUpdateTime = currentTime;
  }

  actualizarCostoPorDistancia() {
    this.getCurrentPosition();
    this.calcularDistanciaRecorrida();

    const currentHour = this.currentTime.getHours();
    if (this.lastDistance >= 250) {
      this.costo_viaje += currentHour >= 5 && currentHour < 22 ? 1.07 : 1.28;
      this.cobroPorTiempo = false;
      this.cobroPorDistancia = true;
      clearInterval(this.interval);
      clearInterval(this.positionInterval);
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

    return distance;
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
    clearInterval(this.positionInterval);

    this.cobroPorTiempo = false;
    this.cobroPorDistancia = false;
  }

  showCurrentDate() {
    this.currentTime = new Date();
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  diasSemana: string[] = ['1', '2', '3', '4', '5', '6', '7'];
  diasSemanaEsp: string[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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
    '1',
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
}
