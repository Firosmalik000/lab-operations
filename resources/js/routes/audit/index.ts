import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/administration/audit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
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
const audit = {
    index: Object.assign(index, index),
}

export default audit