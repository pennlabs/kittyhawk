# Kittyhawk

Kittyhawk is the automated Kubernetes YAML generator for Penn Labs. 
With Kittyhawk, you can define an application's deployment configuration in Typescript using objects called [constructs](https://cdk8s.io/docs/v1.0.0-beta.3/concepts/constructs/).

## Getting Started

The easiest way to get started is by creating a `k8s` folder in your project, and cloning the [Kittyhawk starter code](https://github.com/pennlabs/kittyhawk-template) inside. You will also need to add the circleCI orb (WIP) to your ```.circleci``` folder.

To initialize the project, run ```yarn install``` 

Next, write your configuration in the ```buildChart``` function in the ```main.ts``` file. Check the [API docs](API.md) for a list of available properties. 

You can now run `yarn run build` to try to synthesize your configuration. The generated YAML will be saved to a file located at `k8s/dist/kittyhawk.k8s.yaml`. You should not commit this file. On every push, Circle CI will automatically generate the YAML configuration. On every push to the master branch, CircleCI will also automatically deploy the generated YAML to production.

This is a sample configuration deploying a Django Application and a React Application for Penn Clubs:

```
import { DjangoApplication, ReactApplication, synth } from '@pennlabs/kittyhawk';
import { Construct } from 'constructs'; 

export function buildChart(scope: Construct) {

  /** This creates a Django Application named django-asgi **/
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

  /** This creates a React Application named react **/
  new ReactApplication(scope, 'react', {
    image: 'pennlabs/penn-clubs-frontend',
    replicas: 2,
    domain: 'pennclubs.com',
    ingressPaths: ['/'],
    extraEnv: [{ name: 'PORT', value: '80' }],
  })

}

// Synthesizes the chart
synth(buildChart);

```
The [tfegame repository]() contains another example of an application being deployed with Kittyhawk. 