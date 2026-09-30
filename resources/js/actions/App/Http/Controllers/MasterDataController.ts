import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\MasterDataController::index
 * @see app/Http/Controllers/MasterDataController.php:33
 * @route '/master/{resource}'
 */
export const index = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/master/{resource}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MasterDataController::index
 * @see app/Http/Controllers/MasterDataController.php:33
 * @route '/master/{resource}'
 */
index.url = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { resource: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    resource: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        resource: args.resource,
                }

    return index.definition.url
            .replace('{resource}', parsedArgs.resource.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MasterDataController::index
 * @see app/Http/Controllers/MasterDataController.php:33
 * @route '/master/{resource}'
 */
index.get = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MasterDataController::index
 * @see app/Http/Controllers/MasterDataController.php:33
 * @route '/master/{resource}'
 */
index.head = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MasterDataController::index
 * @see app/Http/Controllers/MasterDataController.php:33
 * @route '/master/{resource}'
 */
    const indexForm = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MasterDataController::index
 * @see app/Http/Controllers/MasterDataController.php:33
 * @route '/master/{resource}'
 */
        indexForm.get = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MasterDataController::index
 * @see app/Http/Controllers/MasterDataController.php:33
 * @route '/master/{resource}'
 */
        indexForm.head = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\MasterDataController::store
 * @see app/Http/Controllers/MasterDataController.php:61
 * @route '/master/{resource}'
 */
export const store = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/master/{resource}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MasterDataController::store
 * @see app/Http/Controllers/MasterDataController.php:61
 * @route '/master/{resource}'
 */
store.url = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { resource: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    resource: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        resource: args.resource,
                }

    return store.definition.url
            .replace('{resource}', parsedArgs.resource.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MasterDataController::store
 * @see app/Http/Controllers/MasterDataController.php:61
 * @route '/master/{resource}'
 */
store.post = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MasterDataController::store
 * @see app/Http/Controllers/MasterDataController.php:61
 * @route '/master/{resource}'
 */
    const storeForm = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MasterDataController::store
 * @see app/Http/Controllers/MasterDataController.php:61
 * @route '/master/{resource}'
 */
        storeForm.post = (args: { resource: string | number } | [resource: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\MasterDataController::update
 * @see app/Http/Controllers/MasterDataController.php:74
 * @route '/master/{resource}/{id}'
 */
export const update = (args: { resource: string | number, id: string | number } | [resource: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/master/{resource}/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\MasterDataController::update
 * @see app/Http/Controllers/MasterDataController.php:74
 * @route '/master/{resource}/{id}'
 */
update.url = (args: { resource: string | number, id: string | number } | [resource: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    resource: args[0],
                    id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        resource: args.resource,
                                id: args.id,
                }

    return update.definition.url
            .replace('{resource}', parsedArgs.resource.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MasterDataController::update
 * @see app/Http/Controllers/MasterDataController.php:74
 * @route '/master/{resource}/{id}'
 */
update.put = (args: { resource: string | number, id: string | number } | [resource: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\MasterDataController::update
 * @see app/Http/Controllers/MasterDataController.php:74
 * @route '/master/{resource}/{id}'
 */
    const updateForm = (args: { resource: string | number, id: string | number } | [resource: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MasterDataController::update
 * @see app/Http/Controllers/MasterDataController.php:74
 * @route '/master/{resource}/{id}'
 */
        updateForm.put = (args: { resource: string | number, id: string | number } | [resource: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\MasterDataController::destroy
 * @see app/Http/Controllers/MasterDataController.php:93
 * @route '/master/{resource}/{id}'
 */
export const destroy = (args: { resource: string | number, id: string | number } | [resource: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/master/{resource}/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\MasterDataController::destroy
 * @see app/Http/Controllers/MasterDataController.php:93
 * @route '/master/{resource}/{id}'
 */
destroy.url = (args: { resource: string | number, id: string | number } | [resource: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    resource: args[0],
                    id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        resource: args.resource,
                                id: args.id,
                }

    return destroy.definition.url
            .replace('{resource}', parsedArgs.resource.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MasterDataController::destroy
 * @see app/Http/Controllers/MasterDataController.php:93
 * @route '/master/{resource}/{id}'
 */
destroy.delete = (args: { resource: string | number, id: string | number } | [resource: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\MasterDataController::destroy
 * @see app/Http/Controllers/MasterDataController.php:93
 * @route '/master/{resource}/{id}'
 */
    const destroyForm = (args: { resource: string | number, id: string | number } | [resource: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MasterDataController::destroy
 * @see app/Http/Controllers/MasterDataController.php:93
 * @route '/master/{resource}/{id}'
 */
        destroyForm.delete = (args: { resource: string | number, id: string | number } | [resource: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const MasterDataController = { index, store, update, destroy }

export default MasterDataController