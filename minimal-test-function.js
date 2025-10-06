module.exports = async function (context, req) {
    context.log('Minimal test function triggered');

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            success: true,
            message: 'Minimal test function works!',
            timestamp: new Date().toISOString(),
            function: 'MinimalTest'
        }
    };
};

















