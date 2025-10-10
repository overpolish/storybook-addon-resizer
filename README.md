<h1 align="center">
  <img src="icon.png" alt="Storybook Addon Resizer Icon" height="34" style="vertical-align: sub;" />
  Storybook Addon Resizer
</h1>

<div align="center">

[![Storybook][storybook-shield]][storybook-url]

</div>

The viewport is static and it cuts off overflow. With the **Resizer** addon you get the power of viewports _AND_ a slider to easily update the container width.

<div align="center">
  <img src="https://github.com/user-attachments/assets/7b8d8661-f97f-48b0-91ab-f6a1dfba9c88" alt="resizer-addon-preview" width="600">
</div>

&nbsp;

```sh
npm install -D storybook-addon-resizer
```

## Usage

> [!IMPORTANT]
> Resizer does _not_ work in `centered` layouts or docs.

It just works out the box ⚡️

You can set an initial width for all stories:

```ts
const preview: Preview = {
  initialGlobals: {
    // ...
    resizer: { width: 200 },
  },
};
```

All stories for a component:

```ts
const meta: Meta<typeof Component> = {
  // ...
  globals: { resizer: { width: 300 } },
};
```

Or, for a single story:

```ts
export const Large: Story = {
  // ...
  globals: { resizer: { width: 400 } },
};
```

Values are provided in `px`.

<!-- Links -->

[storybook-shield]: https://img.shields.io/badge/-Storybook?logo=storybook&logoColor=%23FF4785&color=white
[storybook-url]: https://storybook.js.org
