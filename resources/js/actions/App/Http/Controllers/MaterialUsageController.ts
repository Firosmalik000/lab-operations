import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\MaterialUsageController::items
 * @see app/Http/Controllers/MaterialUsageController.php:62
 * @route '/material-usages/items'
 */
export const items = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: items.url(options),
    method: 'get',
})

items.definition = {
    methods: ["get","head"],
    url: '/material-usages/items',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MaterialUsageController::items
 * @see app/Http/Controllers/MaterialUsageController.php:62
 * @route '/material-usages/items'
 */
items.url = (options?: RouteQueryOptions) => {
    return items.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MaterialUsageController::items
 * @see app/Http/Controllers/MaterialUsageController.php:62
 * @route '/material-usages/items'
 */
items.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: items.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MaterialUsageController::items
 * @see app/Http/Controllers/MaterialUsageController.php:62
 * @route '/material-usages/items'
 */
items.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: items.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MaterialUsageController::items
 * @see app/Http/Controllers/MaterialUsageController.php:62
 * @route '/material-usages/items'
 */
    const itemsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: items.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MaterialUsageController::items
 * @see app/Http/Controllers/MaterialUsageController.php:62
 * @route '/material-usages/items'
 */
        itemsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: items.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MaterialUsageController::items
 * @see app/Http/Controllers/MaterialUsageController.php:62
 * @route '/material-usages/items'
 */
        itemsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: items.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    items.form = itemsForm
/**
* @see \App\Http\Controllers\MaterialUsageController::index
 * @see app/Http/Controllers/MaterialUsageController.php:24
 * @route '/material-usages'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/material-usages',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MaterialUsageController::index
 * @see app/Http/Controllers/MaterialUsageController.php:24
 * @route '/material-usages'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MaterialUsageController::index
 * @see app/Http/Controllers/MaterialUsageController.php:24
 * @route '/material-usages'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MaterialUsageController::index
 * @see app/Http/Controllers/MaterialUsageController.php:24
 * @route '/material-usages'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MaterialUsageController::index
 * @see app/Http/Controllers/MaterialUsageController.php:24
 * @route '/material-usages'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MaterialUsageController::index
 * @see app/Http/Controllers/MaterialUsageController.php:24
 * @route '/material-usages'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MaterialUsageController::index
 * @see app/Http/Controllers/MaterialUsageController.php:24
 * @route '/material-usages'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\MaterialUsageController::create
 * @see app/Http/Controllers/MaterialUsageController.php:48
 * @route '/material-usages/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/material-usages/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MaterialUsageController::create
 * @see app/Http/Controllers/MaterialUsageController.php:48
 * @route '/material-usages/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MaterialUsageController::create
 * @see app/Http/Controllers/MaterialUsageController.php:48
 * @route '/material-usages/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MaterialUsageController::create
 * @see app/Http/Controllers/MaterialUsageController.php:48
 * @route '/material-usages/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MaterialUsageController::create
 * @see app/Http/Controllers/MaterialUsageController.php:48
 * @route '/material-usages/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MaterialUsageController::create
 * @see app/Http/Controllers/MaterialUsageController.php:48
 * @route '/material-usages/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MaterialUsageController::create
 * @see app/Http/Controllers/MaterialUsageController.php:48
 * @route '/material-usages/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\MaterialUsageController::store
 * @see app/Http/Controllers/MaterialUsageController.php:81
 * @route '/material-usages'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/material-usages',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MaterialUsageController::store
 * @see app/Http/Controllers/MaterialUsageController.php:81
 * @route '/material-usages'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MaterialUsageController::store
 * @see app/Http/Controllers/MaterialUsageController.php:81
 * @route '/material-usages'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MaterialUsageController::store
 * @see app/Http/Controllers/MaterialUsageController.php:81
 * @route '/material-usages'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MaterialUsageController::store
 * @see app/Http/Controllers/MaterialUsageController.php:81
 * @route '/material-usages'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\MaterialUsageController::edit
 * @see app/Http/Controllers/MaterialUsageController.php:106
 * @route '/material-usages/{materialUsage}/edit'
 */
export const edit = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/material-usages/{materialUsage}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MaterialUsageController::edit
 * @see app/Http/Controllers/MaterialUsageController.php:106
 * @route '/material-usages/{materialUsage}/edit'
 */
edit.url = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { materialUsage: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { materialUsage: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    materialUsage: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        materialUsage: typeof args.materialUsage === 'object'
                ? args.materialUsage.id
                : args.materialUsage,
                }

    return edit.definition.url
            .replace('{materialUsage}', parsedArgs.materialUsage.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MaterialUsageController::edit
 * @see app/Http/Controllers/MaterialUsageController.php:106
 * @route '/material-usages/{materialUsage}/edit'
 */
edit.get = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MaterialUsageController::edit
 * @see app/Http/Controllers/MaterialUsageController.php:106
 * @route '/material-usages/{materialUsage}/edit'
 */
edit.head = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MaterialUsageController::edit
 * @see app/Http/Controllers/MaterialUsageController.php:106
 * @route '/material-usages/{materialUsage}/edit'
 */
    const editForm = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MaterialUsageController::edit
 * @see app/Http/Controllers/MaterialUsageController.php:106
 * @route '/material-usages/{materialUsage}/edit'
 */
        editForm.get = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MaterialUsageController::edit
 * @see app/Http/Controllers/MaterialUsageController.php:106
 * @route '/material-usages/{materialUsage}/edit'
 */
        editForm.head = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\MaterialUsageController::update
 * @see app/Http/Controllers/MaterialUsageController.php:119
 * @route '/material-usages/{materialUsage}'
 */
export const update = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/material-usages/{materialUsage}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\MaterialUsageController::update
 * @see app/Http/Controllers/MaterialUsageController.php:119
 * @route '/material-usages/{materialUsage}'
 */
update.url = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { materialUsage: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { materialUsage: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    materialUsage: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        materialUsage: typeof args.materialUsage === 'object'
                ? args.materialUsage.id
                : args.materialUsage,
                }

    return update.definition.url
            .replace('{materialUsage}', parsedArgs.materialUsage.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MaterialUsageController::update
 * @see app/Http/Controllers/MaterialUsageController.php:119
 * @route '/material-usages/{materialUsage}'
 */
update.put = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\MaterialUsageController::update
 * @see app/Http/Controllers/MaterialUsageController.php:119
 * @route '/material-usages/{materialUsage}'
 */
    const updateForm = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MaterialUsageController::update
 * @see app/Http/Controllers/MaterialUsageController.php:119
 * @route '/material-usages/{materialUsage}'
 */
        updateForm.put = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\MaterialUsageController::show
 * @see app/Http/Controllers/MaterialUsageController.php:88
 * @route '/material-usages/{materialUsage}'
 */
export const show = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/material-usages/{materialUsage}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MaterialUsageController::show
 * @see app/Http/Controllers/MaterialUsageController.php:88
 * @route '/material-usages/{materialUsage}'
 */
show.url = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { materialUsage: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { materialUsage: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    materialUsage: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        materialUsage: typeof args.materialUsage === 'object'
                ? args.materialUsage.id
                : args.materialUsage,
                }

    return show.definition.url
            .replace('{materialUsage}', parsedArgs.materialUsage.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MaterialUsageController::show
 * @see app/Http/Controllers/MaterialUsageController.php:88
 * @route '/material-usages/{materialUsage}'
 */
show.get = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MaterialUsageController::show
 * @see app/Http/Controllers/MaterialUsageController.php:88
 * @route '/material-usages/{materialUsage}'
 */
show.head = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MaterialUsageController::show
 * @see app/Http/Controllers/MaterialUsageController.php:88
 * @route '/material-usages/{materialUsage}'
 */
    const showForm = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MaterialUsageController::show
 * @see app/Http/Controllers/MaterialUsageController.php:88
 * @route '/material-usages/{materialUsage}'
 */
        showForm.get = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MaterialUsageController::show
 * @see app/Http/Controllers/MaterialUsageController.php:88
 * @route '/material-usages/{materialUsage}'
 */
        showForm.head = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\MaterialUsageController::voidMethod
 * @see app/Http/Controllers/MaterialUsageController.php:126
 * @route '/material-usages/{materialUsage}/void'
 */
export const voidMethod = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: voidMethod.url(args, options),
    method: 'post',
})

voidMethod.definition = {
    methods: ["post"],
    url: '/material-usages/{materialUsage}/void',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MaterialUsageController::voidMethod
 * @see app/Http/Controllers/MaterialUsageController.php:126
 * @route '/material-usages/{materialUsage}/void'
 */
voidMethod.url = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { materialUsage: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { materialUsage: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    materialUsage: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        materialUsage: typeof args.materialUsage === 'object'
                ? args.materialUsage.id
                : args.materialUsage,
                }

    return voidMethod.definition.url
            .replace('{materialUsage}', parsedArgs.materialUsage.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MaterialUsageController::voidMethod
 * @see app/Http/Controllers/MaterialUsageController.php:126
 * @route '/material-usages/{materialUsage}/void'
 */
voidMethod.post = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: voidMethod.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MaterialUsageController::voidMethod
 * @see app/Http/Controllers/MaterialUsageController.php:126
 * @route '/material-usages/{materialUsage}/void'
 */
    const voidMethodForm = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: voidMethod.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MaterialUsageController::voidMethod
 * @see app/Http/Controllers/MaterialUsageController.php:126
 * @route '/material-usages/{materialUsage}/void'
 */
        voidMethodForm.post = (args: { materialUsage: number | { id: number } } | [materialUsage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: voidMethod.url(args, options),
            method: 'post',
        })
    
    voidMethod.form = voidMethodForm
const MaterialUsageController = { items, index, create, store, edit, update, show, voidMethod, void: voidMethod }

export default MaterialUsageController