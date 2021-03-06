import { Chart, synth } from '../lib';
import { Testing } from 'cdk8s';
import { Construct } from 'constructs';
import { CronJob } from '../lib/cronjob';
import { Application, DjangoApplication, ReactApplication } from '../lib/application'


// Only overriding this for testing purposes
process.env.RELEASE_NAME = 'RELEASE_NAME';
process.env.IMAGE_TAG = 'TAG_FROM_CI';

/** UNIT TEST CONFIGS */

export function buildTagOverrideChart(scope: Construct) {

  /** Overrides the image tag set as env var **/
  new Application(scope, 'serve', {
    image: 'pennlabs/website',
    tag: 'latest',
  })
}

export function buildProbeChart(scope: Construct) {

  /** Probe tests **/
  new Application(scope, 'serve', {
    image: 'pennlabs/website',
    readinessProbe: { path: '/', delay: 5 }, // Default on?
    livenessProbe: { command: ['test', 'command'], period: 5 },
  })
}

export function buildAutoscalingChart(scope: Construct) {

  /** Autoscaling test **/
  new Application(scope, 'serve', {
    image: 'pennlabs/website',
    autoScalingProps: { cpu: 80, memory:80, requests:80 },
  })
}

export function buildFailingDjangoChart(scope: Construct) {

  /** Django Duplicated DOMAIN Env should fail **/
  new DjangoApplication(scope, 'platform', {
    image: 'pennlabs/platform',
    domain: 'platform.pennlabs.org',
    extraEnv: [ { name: 'DOMAIN', value: 'platform.pennlabs.org' },
      { name: 'DJANGO_SETTINGS_MODULE', value: 'Platform.settings.production' }],
    ingressPaths: ['/'],
  })
}

export function buildFailingReactChart(scope: Construct) {

  /** React Duplicated DOMAIN Env should fail **/
  new ReactApplication(scope, 'react', {
    image: 'pennlabs/penn-clubs-frontend',
    replicas: 2,
    domain: 'pennclubs.com',
    ingressPaths: ['/'],
    extraEnv: [ { name: 'DOMAIN', value: 'pennclubs.com' },
      { name: 'PORT', value: '80' }],
  })
}

export function buildFailingIngressChart(scope: Construct) {

  /** Incorrect ingress host string should fail**/
  new Application(scope, 'serve', {
    image: 'pennlabs/website',
    tag: 'latest',
    ingress: [{ host: 'pennlabsorg', paths: ['/'] }],
  })
}

export function buildFailingAutoscalingChart(scope: Construct) {

  /** Autoscaling cannot be defined with replicas, should fail. **/
  new Application(scope, 'serve', {
    image: 'pennlabs/website',
    tag: 'latest',
    replicas: 2,
    autoScalingProps: { cpu: 80 },
  })
}

export function buildFailingProbeChart(scope: Construct) {

  /** Probes should fail if neither command or path is defined **/
  new Application(scope, 'serve', {
    image: 'pennlabs/website',
    tag: 'latest',
    readinessProbe: { delay: 5 }, 
    livenessProbe: { period: 5 },
  })
}

/** INTEGRATION TEST CONFIGS */

export function buildWebsiteChart(scope: Construct) {

  /** Penn Labs Website **/
  new Application(scope, 'serve', {
    image: 'pennlabs/website',
    ingress: [{ host: 'pennlabs.org', paths: ['/'] }],
  })
}

export function buildBasicsChart(scope: Construct) {

  /** Penn Basics **/
  new Application(scope, 'react', {
    image: 'pennlabs/penn-basics',
    secret: 'penn-basics',
    extraEnv: [{ name: 'PORT', value: '80' }],
    ingress: [{ host: 'pennbasics.com', paths: ['/'] }] ,
  })
}

export function buildOHQChart(scope: Construct) {

  /** OHQ (Part of it) **/
  new DjangoApplication(scope, 'django-asgi', {
    image: 'pennlabs/office-hours-queue-backend',
    secret: 'office-hours-queue',
    cmd: ['/usr/local/bin/asgi-run'],
    replicas: 2,
    domain: 'ohq.io',
    ingressPaths: ['/api/ws'],
    extraEnv: [
      { name: 'DJANGO_SETTINGS_MODULE', value: 'officehoursqueue.settings.production' },
      { name: 'REDIS_URL', value: 'redis://office-hours-queue-redis:6379' }],
  })

  new CronJob(scope, 'calculate-waits', {
    schedule: '*/5 * * * *',
    image: 'pennlabs/office-hours-queue-backend',
    secret: 'office-hours-queue',
    cmd: ['python', 'manage.py', 'calculatewaittimes'],
  });

}

export function buildCoursesChart(scope: Construct) {

  /** Penn Courses (Part of it) **/
  new Application(scope, 'backend', {
    image: 'pennlabs/penn-courses-backend',
    secret: 'penn-courses',
    cmd: ['celery', 'worker', '-A', 'PennCourses', '-Q', 'alerts,celery', '-linfo'],
    replicas: 3,
    extraEnv: [{ name: 'PORT', value: '80' },
      { name: 'DJANGO_SETTINGS_MODULE', value: 'PennCourses.settings.production' }],
    ingress:  [
      { host: 'penncourseplan.com', paths: ['/api', '/admin', '/accounts', '/assets'] },
      { host: 'penncoursealert.com', paths: ['/api', '/admin', '/accounts', '/assets', '/webhook'] },
      { host: 'review.penncourses.org', paths: ['/api', '/admin', '/accounts', '/assets'] },
    ],
  })
}

export function buildPlatformChart(scope: Construct) {

  /** Platform **/
  new DjangoApplication(scope, 'platform', {
    image: 'pennlabs/platform',
    secret: 'platform',
    port: 443,
    domain: 'platform.pennlabs.org',
    extraEnv: [
      { name: 'DJANGO_SETTINGS_MODULE', value: 'Platform.settings.production' }],
    ingressPaths: ['/'],
    secretMounts: [{ name: 'platform', subPath: 'SHIBBOLETH_CERT', mountPath: '/etc/shibboleth/sp-cert.pem' },
      { name: 'platform', subPath: 'SHIBBOLETH_KEY', mountPath: '/etc/shibboleth/sp-key.pem' }],
  })
}

export function buildClubsChart(scope: Construct) {

  /** Penn Clubs **/
  new DjangoApplication(scope, 'django-asgi', {
    image: 'pennlabs/penn-clubs-backend',
    secret: 'penn-clubs',
    cmd: ['/usr/local/bin/asgi-run'],
    replicas: 2,
    domain: 'pennclubs.com',
    ingressPaths: ['/api/ws'],
    extraEnv: [
      { name: 'DJANGO_SETTINGS_MODULE', value: 'pennclubs.settings.production' },
      { name: 'REDIS_HOST', value: 'penn-clubs-redis' }],
  })

  new ReactApplication(scope, 'react', {
    image: 'pennlabs/penn-clubs-frontend',
    replicas: 2,
    domain: 'pennclubs.com',
    ingressPaths: ['/'],
    extraEnv: [{ name: 'PORT', value: '80' }],
  })

}



/** Helper function to run each chart test */
const chartTest = (build: (scope: Construct) => void) => {
  const app = Testing.app();
  const chart = new Chart(app, 'kittyhawk', build);
  const results = Testing.synth(chart)
  expect(results).toMatchSnapshot();
}

/** Helper function to run each chart test */
const failingTest = (build: (scope: Construct) => void) => {
  const app = Testing.app();
  expect(() => {new Chart(app, 'kittyhawk', build)}).toThrowError();
}

describe('Unit Tests', () => {
  
  test('Tag Override', () => chartTest(buildTagOverrideChart));

  test('Autoscaling', () => chartTest(buildAutoscalingChart));
  
  test('Readiness/Liveliness Probes', () => chartTest(buildProbeChart));

  test('Django Application -- Failing', () => failingTest(buildFailingDjangoChart));
  
  test('React Application -- Failing', () => failingTest(buildFailingReactChart));

  test('Ingress Regex -- Failing', () => failingTest(buildFailingIngressChart));

  test('Autoscaling -- Failing', () => failingTest(buildFailingAutoscalingChart));

  test('Probes -- Failing', () => failingTest(buildFailingProbeChart));

});

describe('Integration Tests', () => {
  test('Penn Labs Website', () => chartTest(buildWebsiteChart));

  test('Penn Basics', () => chartTest(buildBasicsChart));

  test('OHQ', () => chartTest(buildOHQChart));

  test('Penn Courses', () => chartTest(buildCoursesChart));

  test('Platform API', () => chartTest(buildPlatformChart));

  test('Penn Clubs', () => chartTest(buildClubsChart));


});

describe('Misc Tests', () => {
  test('Synth Function', () => 
    expect(function() {synth(buildWebsiteChart)}).not.toThrow());
});
