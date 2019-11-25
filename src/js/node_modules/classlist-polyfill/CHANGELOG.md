# Changelog

## 1.2.0

* Rewrite history for [yola/classlist-polyfill][], branching and rebasing
  from [eligrey/classList][].
* Update fork
  * Update package.json to use Unlicense [eligrey#56][]
  * Fixes add/remove/toggle in IE10 and IE11 [eligrey#57][]
  * IE8 fixes [eligrey#43][]

[yola/classlist-polyfill]: https://github.com/yola/classlist-polyfill
[eligrey/classList]: https://github.com/eligrey/classList.js
[eligrey#57]: https://github.com/eligrey/classList.js/pull/57
[eligrey#56]: https://github.com/eligrey/classList.js/pull/56
[eligrey#43]: https://github.com/eligrey/classList.js/pull/43


## 1.0.3

* Add support for missing SVGElement.classList in IE


## 1.0.2

* Fix issue with `self` not being defined in CommonJS
